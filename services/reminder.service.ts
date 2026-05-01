import { ReminderType, type Contract } from "@prisma/client";
import { addDaysUtc, endOfUtcDay, startOfUtcDay } from "@/lib/date";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit.service";
import { enqueueReminderJobs } from "@/services/queue/reminder-queue.service";
import type { ReminderCandidate, ReminderJobSummary, ReminderPreviewResult } from "@/types/reminder";
import type { ReminderQueuePayload } from "@/types/reminder-queue";

const DEFAULT_REMINDER_DAYS = 7;
const DEFAULT_REMINDER_THRESHOLDS = [30, 15, 7];
const DAY_MS = 24 * 60 * 60 * 1000;

function parseReminderThresholds(contract: Pick<Contract, "renewalReminderDays" | "reminderOffsets">): number[] {
  const offsets = (contract.reminderOffsets ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (offsets.length > 0) {
    return Array.from(new Set(offsets)).sort((a, b) => b - a);
  }
  if (contract.renewalReminderDays && contract.renewalReminderDays > 0) {
    return [contract.renewalReminderDays];
  }
  return DEFAULT_REMINDER_THRESHOLDS;
}

function resolveReminderSignal(
  contract: Pick<Contract, "endDate" | "renewalReminderDays" | "reminderOffsets">,
  now: Date,
): { reminderType: ReminderType; reminderThresholdDays: number | null } | null {
  const todayStart = startOfUtcDay(now);
  const contractEndStart = startOfUtcDay(contract.endDate);
  const daysUntilEnd = Math.floor((contractEndStart.getTime() - todayStart.getTime()) / DAY_MS);

  if (daysUntilEnd < 0) {
    return { reminderType: ReminderType.EXPIRED, reminderThresholdDays: null };
  }

  const thresholds = parseReminderThresholds(contract);
  if (thresholds.includes(daysUntilEnd)) {
    return { reminderType: ReminderType.EXPIRING_SOON, reminderThresholdDays: daysUntilEnd };
  }

  return null;
}

export function computeContractLifecycleStatus(
  contract: Pick<Contract, "endDate" | "renewalReminderDays" | "reminderOffsets">,
  now: Date,
): "EXPIRED" | "EXPIRING_SOON" | "NORMAL" {
  const type = resolveReminderType(contract, now);
  if (type === ReminderType.EXPIRED) return "EXPIRED";
  if (type === ReminderType.EXPIRING_SOON) return "EXPIRING_SOON";
  return "NORMAL";
}

export function resolveReminderType(
  contract: Pick<Contract, "endDate" | "renewalReminderDays" | "reminderOffsets">,
  now: Date,
): ReminderType | null {
  return resolveReminderSignal(contract, now)?.reminderType ?? null;
}

export async function shouldSkipReminder(contractId: string, reminderType: ReminderType, now: Date): Promise<boolean> {
  const existing = await prisma.reminderLog.findFirst({
    where: {
      contractId,
      reminderType,
      createdAt: {
        gte: startOfUtcDay(now),
        lte: endOfUtcDay(now),
      },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

type DispatchPayload = {
  contractId: string;
  contractCode: string;
  title: string;
  partnerEmail: string | null;
  reminderType: ReminderType;
  reminderThresholdDays: number | null;
  endDate: Date;
};

export function buildReminderPayload(candidate: ReminderCandidate): DispatchPayload {
  return {
    contractId: candidate.contractId,
    contractCode: candidate.contractCode,
    title: candidate.title,
    partnerEmail: candidate.partnerEmail,
    reminderType: candidate.reminderType,
    reminderThresholdDays: candidate.reminderThresholdDays,
    endDate: candidate.endDate,
  };
}

function toQueuePayload(payload: DispatchPayload): ReminderQueuePayload {
  return {
    contractCode: payload.contractCode,
    title: payload.title,
    endDate: payload.endDate.toISOString(),
    reminderThresholdDays: payload.reminderThresholdDays,
  };
}

export async function getReminderCandidates(options?: { now?: Date; limit?: number }): Promise<ReminderPreviewResult> {
  const now = options?.now ?? new Date();
  const limit = options?.limit ?? 100;
  const todayStart = startOfUtcDay(now);
  const maxWindow = addDaysUtc(endOfUtcDay(now), 365);

  const contracts = await prisma.contract.findMany({
    where: {
      endDate: {
        lte: maxWindow,
      },
    },
    orderBy: { endDate: "asc" },
    take: limit,
    select: {
      id: true,
      code: true,
      title: true,
      partnerEmail: true,
      endDate: true,
      renewalReminderDays: true,
      reminderOffsets: true,
    },
  });

  const mapped: ReminderCandidate[] = [];
  for (const contract of contracts) {
    const signal = resolveReminderSignal(contract, now);
    if (!signal) continue;
    const { reminderType, reminderThresholdDays } = signal;

    // Ignore contracts that end exactly at far-past dates out of operational relevance.
    if (reminderType === ReminderType.EXPIRED && contract.endDate < addDaysUtc(todayStart, -3650)) {
      continue;
    }

    mapped.push({
      contractId: contract.id,
      contractCode: contract.code,
      title: contract.title,
      partnerEmail: contract.partnerEmail,
      endDate: contract.endDate,
      reminderType,
      reminderThresholdDays:
        reminderType === ReminderType.EXPIRED ? null : (reminderThresholdDays ?? contract.renewalReminderDays ?? DEFAULT_REMINDER_DAYS),
    });
  }

  return {
    now,
    totalCandidates: mapped.length,
    candidates: mapped,
  };
}

export async function processReminderCandidates(options?: {
  now?: Date;
  limit?: number;
  triggeredByUserId?: string;
  triggerSource?: "admin" | "cron";
}): Promise<ReminderJobSummary> {
  const now = options?.now ?? new Date();
  const preview = await getReminderCandidates({ now, limit: options?.limit ?? 100 });
  const existingTodayLogs = await prisma.reminderLog.findMany({
    where: {
      contractId: { in: preview.candidates.map((candidate) => candidate.contractId) },
      createdAt: {
        gte: startOfUtcDay(now),
        lte: endOfUtcDay(now),
      },
    },
    select: {
      contractId: true,
      reminderType: true,
      reminderThresholdDays: true,
    },
  });
  const dedupeKeys = new Set(
    existingTodayLogs.map((entry) => `${entry.contractId}:${entry.reminderType}:${entry.reminderThresholdDays ?? "null"}`),
  );

  let eligible = 0;
  let skipped = 0;
  let pending = 0;
  let sent = 0;
  let failed = 0;
  const enqueueItems: Array<{
    contractId: string;
    recipientEmail: string;
    type: ReminderType;
    reminderThresholdDays: number | null;
    payload: ReminderQueuePayload;
  }> = [];

  for (const candidate of preview.candidates) {
    const skip = dedupeKeys.has(`${candidate.contractId}:${candidate.reminderType}:${candidate.reminderThresholdDays ?? "null"}`);
    if (skip) {
      skipped += 1;
      continue;
    }

    if (!candidate.partnerEmail) {
      failed += 1;
      await createAuditLog({
        userId: options?.triggeredByUserId,
        action: "FAIL_ENQUEUE_REMINDER_JOB",
        entityType: "CONTRACT",
        entityId: candidate.contractId,
        metadata: {
          reminderType: candidate.reminderType,
          sentTo: candidate.partnerEmail,
          error: "Partner email is missing",
        },
      });
      continue;
    }

    eligible += 1;
    const payload = buildReminderPayload(candidate);
    enqueueItems.push({
      contractId: payload.contractId,
      recipientEmail: candidate.partnerEmail,
      type: payload.reminderType,
      reminderThresholdDays: payload.reminderThresholdDays,
      payload: toQueuePayload(payload),
    });
  }

  const createdJobs = await enqueueReminderJobs(enqueueItems);
  pending += createdJobs.length;
  logger.info("reminder.enqueue.summary", {
    triggerSource: options?.triggerSource ?? "admin",
    createdJobs: createdJobs.length,
  });

  const summary: ReminderJobSummary = {
    scanned: preview.totalCandidates,
    eligible,
    skipped,
    sent,
    pending,
    failed,
  };

  await createAuditLog({
    userId: options?.triggeredByUserId,
    action: "RUN_REMINDER_JOB",
    entityType: "REMINDER_JOB",
    entityId: `job-${now.getTime()}`,
    metadata: {
      triggerSource: options?.triggerSource ?? "admin",
      ...summary,
    },
  });

  return summary;
}
