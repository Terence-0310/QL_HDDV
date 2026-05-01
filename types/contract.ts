import type { ContractStatus } from "@prisma/client";

export type CreateContractInput = {
  code: string;
  title: string;
  partnerName: string;
  partnerEmail?: string;
  description?: string;
  value: number;
  startDate: Date;
  endDate: Date;
  signedDate?: Date;
  status?: ContractStatus;
  renewalReminderDays?: number;
  reminderThresholdDays?: number[];
  autoRenew?: boolean;
  fileUrl?: string;
  fileName?: string;
  originalFileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  uploadedAt?: Date;
  note?: string;
  ownerId: string;
  parentContractId?: string;
  renewalVersion?: number;
  renewedAt?: Date;
};

export type UpdateContractInput = Partial<Omit<CreateContractInput, "ownerId">>;

export type ListContractsInput = {
  status?: ContractStatus;
  ownerId?: string;
  search?: string;
  autoRenew?: boolean;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  sortBy?: "createdAt" | "updatedAt" | "endDate" | "title" | "value";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type ContractListResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
