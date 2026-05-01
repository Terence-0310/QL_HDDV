import type { ReminderSendStatus, ReminderType } from "@prisma/client";

export type ReminderCandidate = {
  contractId: string;
  contractCode: string;
  title: string;
  partnerEmail: string | null;
  endDate: Date;
  reminderType: ReminderType;
  reminderThresholdDays: number | null;
};

export type ReminderDispatchResult = {
  status: ReminderSendStatus;
  message?: string;
  sentAt?: Date;
};

export type ReminderJobSummary = {
  scanned: number;
  eligible: number;
  skipped: number;
  sent: number;
  pending: number;
  failed: number;
};

export type ReminderPreviewResult = {
  now: Date;
  totalCandidates: number;
  candidates: ReminderCandidate[];
};
