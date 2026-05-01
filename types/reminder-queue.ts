import type { ReminderJobStatus, ReminderType } from "@prisma/client";

export type ReminderQueuePayload = {
  contractCode: string;
  title: string;
  endDate: string;
  reminderThresholdDays: number | null;
};

export type EnqueueSummary = {
  scanned: number;
  eligible: number;
  skipped: number;
  sent: number;
  pending: number;
  failed: number;
};

export type WorkerSummary = {
  scanned: number;
  picked: number;
  success: number;
  failed: number;
  retried: number;
  deadLettered: number;
};

export type ReminderJobLogContext = {
  jobId: string;
  contractId: string;
  type: ReminderType;
  status: ReminderJobStatus;
};
