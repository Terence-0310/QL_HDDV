import type { ContractStatus } from "@prisma/client";

export type RenewContractInput = {
  title?: string;
  partnerName?: string;
  partnerEmail?: string;
  description?: string;
  value?: number;
  startDate: Date;
  endDate: Date;
  signedDate?: Date;
  autoRenew?: boolean;
  renewalReminderDays?: number;
  note?: string;
  status?: ContractStatus;
};
