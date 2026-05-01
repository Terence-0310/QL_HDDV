import type { ContractStatus } from "@prisma/client";

export type RejectContractInput = {
  reason: string;
};

export type ApprovalQueueQuery = {
  page?: number;
  pageSize?: number;
  ownerId?: string;
  search?: string;
  sortBy?: "submittedForApprovalAt" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
  status?: ContractStatus;
};
