import { Prisma, ReminderJobStatus, type ReminderType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getReminderQueueConfig } from "@/services/queue/reminder-queue.config";

type EnqueueInput = {
  contractId: string;
  recipientEmail: string;
  type: ReminderType;
  reminderThresholdDays?: number | null;
  payload?: Prisma.InputJsonValue;
  scheduledAt?: Date;
};

export async function enqueueReminderJobs(items: EnqueueInput[]) {
  const config = getReminderQueueConfig();
  if (!items.length) return [];

  const now = new Date();
  const jobs = await prisma.$transaction(
    items.map((item) =>
      prisma.reminderJob.create({
        data: {
          contractId: item.contractId,
          recipientEmail: item.recipientEmail,
          type: item.type,
          status: ReminderJobStatus.PENDING,
          attempts: 0,
          maxAttempts: config.maxAttempts,
          scheduledAt: item.scheduledAt ?? now,
          nextAttemptAt: item.scheduledAt ?? now,
          payload: item.payload,
          reminderThresholdDays: item.reminderThresholdDays ?? null,
        },
      }),
    ),
  );

  if (config.verboseWorkerLogs) {
    for (const job of jobs) {
      logger.info("reminder.job.created", {
        jobId: job.id,
        contractId: job.contractId,
        type: job.type,
        nextAttemptAt: job.nextAttemptAt.toISOString(),
      });
    }
  }

  return jobs;
}

export async function listDueReminderJobs(limit: number, now: Date) {
  return prisma.reminderJob.findMany({
    where: {
      status: { in: [ReminderJobStatus.PENDING, ReminderJobStatus.FAILED] },
      nextAttemptAt: { lte: now },
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
}

export async function claimReminderJob(jobId: string) {
  const result = await prisma.reminderJob.updateMany({
    where: {
      id: jobId,
      status: { in: [ReminderJobStatus.PENDING, ReminderJobStatus.FAILED] },
    },
    data: {
      status: ReminderJobStatus.PROCESSING,
      processingAt: new Date(),
      errorMessage: null,
    },
  });
  return result.count === 1;
}
