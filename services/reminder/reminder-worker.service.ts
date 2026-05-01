import { ReminderJobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createAuditLog } from "@/services/audit.service";
import { createNotification } from "@/services/notification.service";
import { sendReminderEmailForJob } from "@/services/reminder/reminder-dispatch.service";
import { claimReminderJob, listDueReminderJobs } from "@/services/queue/reminder-queue.service";
import { computeBackoffDelay, getReminderQueueConfig } from "@/services/queue/reminder-queue.config";
import type { ReminderQueuePayload, WorkerSummary } from "@/types/reminder-queue";

function parsePayload(payload: unknown): ReminderQueuePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Partial<ReminderQueuePayload>;
  if (!raw.contractCode || !raw.title || !raw.endDate) return null;
  return {
    contractCode: raw.contractCode,
    title: raw.title,
    endDate: raw.endDate,
    reminderThresholdDays: typeof raw.reminderThresholdDays === "number" ? raw.reminderThresholdDays : null,
  };
}

export async function processPendingReminderJobs(options?: {
  now?: Date;
  limit?: number;
  triggeredByUserId?: string;
}): Promise<WorkerSummary> {
  const config = getReminderQueueConfig();
  const now = options?.now ?? new Date();
  const dueJobs = await listDueReminderJobs(options?.limit ?? config.workerBatchSize, now);

  const summary: WorkerSummary = {
    scanned: dueJobs.length,
    picked: 0,
    success: 0,
    failed: 0,
    retried: 0,
    deadLettered: 0,
  };

  async function processSingleJob(job: (typeof dueJobs)[number]) {
    const claimed = await claimReminderJob(job.id);
    if (!claimed) return;
    summary.picked += 1;

    if (config.verboseWorkerLogs) {
      logger.info("reminder.job.picked", {
        jobId: job.id,
        contractId: job.contractId,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
      });
    }

    const payload = parsePayload(job.payload);
    if (!payload) {
      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: ReminderJobStatus.DEAD_LETTER,
          processedAt: new Date(),
          errorMessage: "Invalid reminder payload",
        },
      });
      summary.failed += 1;
      summary.deadLettered += 1;
      logger.error("reminder.job.dead_letter", { jobId: job.id, reason: "invalid_payload" });
      return;
    }

    const sendResult = await sendReminderEmailForJob({
      contractId: job.contractId,
      recipientEmail: job.recipientEmail,
      reminderType: job.type,
      reminderThresholdDays: payload.reminderThresholdDays ?? job.reminderThresholdDays ?? null,
      contractCode: payload.contractCode,
      contractTitle: payload.title,
      endDate: new Date(payload.endDate),
      triggeredByUserId: options?.triggeredByUserId,
    });

    if (sendResult.success) {
      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: ReminderJobStatus.SUCCESS,
          processedAt: new Date(),
          errorMessage: null,
        },
      });
      summary.success += 1;
      if (config.verboseWorkerLogs) {
        logger.info("reminder.job.success", { jobId: job.id, contractId: job.contractId });
      }
      return;
    }

    const nextAttempts = job.attempts + 1;
    const exhausted = nextAttempts >= job.maxAttempts;

    if (exhausted) {
      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: ReminderJobStatus.DEAD_LETTER,
          attempts: nextAttempts,
          processedAt: new Date(),
          errorMessage: sendResult.errorMessage ?? "Unknown reminder worker error",
        },
      });
      summary.failed += 1;
      summary.deadLettered += 1;
      logger.error("reminder.job.dead_letter", {
        jobId: job.id,
        attempts: nextAttempts,
        maxAttempts: job.maxAttempts,
      });

      try {
        const admins = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
          select: { id: true },
        });
        await Promise.all(
          admins.map((admin) =>
            createNotification({
              userId: admin.id,
              type: "REMINDER_FAILED",
              title: "Cảnh báo: Gửi nhắc hạn thất bại (Dead Letter)",
              message: `Hệ thống không thể gửi thông báo nhắc hạn (Job ID: ${job.id}) cho hợp đồng ${payload?.contractCode ?? job.contractId} sau ${job.maxAttempts} lần thử. Lỗi: ${sendResult.errorMessage ?? "Không xác định"}. Vui lòng kiểm tra cấu hình SMTP hoặc Logs.`,
              relatedEntityType: "REMINDER_JOB",
              relatedEntityId: job.id,
            })
          )
        );
      } catch (notifyError) {
        logger.error("reminder.job.notify_admins_failed", {
          jobId: job.id,
          error: notifyError instanceof Error ? notifyError.message : "Unknown error",
        });
      }

      return;
    }

    const delay = computeBackoffDelay(nextAttempts, config.backoffBaseMs);
    await prisma.reminderJob.update({
      where: { id: job.id },
      data: {
        status: ReminderJobStatus.FAILED,
        attempts: nextAttempts,
        nextAttemptAt: new Date(Date.now() + delay),
        errorMessage: sendResult.errorMessage ?? "Unknown reminder worker error",
      },
    });

    summary.failed += 1;
    summary.retried += 1;
    if (config.verboseWorkerLogs) {
      logger.warn("reminder.job.retry_scheduled", {
        jobId: job.id,
        attempts: nextAttempts,
        maxAttempts: job.maxAttempts,
        delayMs: delay,
      });
    }
  }

  const chunks: Array<Array<(typeof dueJobs)[number]>> = [];
  for (let i = 0; i < dueJobs.length; i += config.workerConcurrency) {
    chunks.push(dueJobs.slice(i, i + config.workerConcurrency));
  }
  for (const chunk of chunks) {
    await Promise.all(chunk.map((job) => processSingleJob(job)));
  }

  await createAuditLog({
    userId: options?.triggeredByUserId,
    action: "RUN_REMINDER_WORKER",
    entityType: "REMINDER_JOB",
    entityId: `worker-${now.getTime()}`,
    metadata: summary,
  });

  return summary;
}
