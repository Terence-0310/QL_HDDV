import { Prisma } from "@prisma/client";

export function buildPaginationOptions(page?: number, pageSize?: number) {
  const safePage = Math.max(page ?? 1, 1);
  const safePageSize = Math.min(Math.max(pageSize ?? 20, 1), 100);
  const skip = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, skip };
}

export function buildContractWhereClause(input: {
  search?: string;
  status?: string;
  ownerId?: string;
  autoRenew?: boolean;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
}): Prisma.ContractWhereInput {
  const dateFilters: Prisma.ContractWhereInput = {};

  if (input.startDateFrom || input.startDateTo) {
    dateFilters.startDate = {
      gte: input.startDateFrom,
      lte: input.startDateTo,
    };
  }

  if (input.endDateFrom || input.endDateTo) {
    dateFilters.endDate = {
      gte: input.endDateFrom,
      lte: input.endDateTo,
    };
  }

  return {
    ...dateFilters,
    status: input.status as Prisma.EnumContractStatusFilter["equals"] | undefined,
    autoRenew: input.autoRenew,
    ownerId: input.ownerId,
    OR: input.search
      ? [
          { title: { contains: input.search } },
          { code: { contains: input.search } },
          { partnerName: { contains: input.search } },
          { partnerEmail: { contains: input.search } },
        ]
      : undefined,
  };
}

export function buildPaginationResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}
