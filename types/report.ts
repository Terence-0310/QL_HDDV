import type { ApprovalStatus, ContractStatus } from "@prisma/client";

export type ContractsReportQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ContractStatus;
  approvalStatus?: ApprovalStatus;
  ownerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  sortBy?: "createdAt" | "updatedAt" | "endDate" | "title" | "value";
  sortOrder?: "asc" | "desc";
};
