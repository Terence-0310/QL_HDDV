import { ApprovalStatus, ContractStatus, UserStatus, ReminderJobStatus, type Prisma } from "@prisma/client";
import { buildCsv } from "@/lib/csv";
import { addDaysUtc, endOfUtcDay, startOfUtcDay } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue } from "@/lib/simple-cache";
import { toCacheKey } from "@/lib/cache-key";
import { createAuditLog } from "@/services/audit.service";
import type { AuthUser } from "@/types/auth";
import type { ContractsReportQuery } from "@/types/report";

function buildContractsReportWhere(query: ContractsReportQuery): Prisma.ContractWhereInput {
  const where: Prisma.ContractWhereInput = {
    status: query.status,
    approvalStatus: query.approvalStatus,
    ownerId: query.ownerId,
    OR: query.search
      ? [
          { code: { contains: query.search } },
          { title: { contains: query.search } },
          { partnerName: { contains: query.search } },
          { partnerEmail: { contains: query.search } },
        ]
      : undefined,
  };

  if (query.startDateFrom || query.startDateTo) {
    where.startDate = {
      gte: query.startDateFrom,
      lte: query.startDateTo,
    };
  }

  if (query.endDateFrom || query.endDateTo) {
    where.endDate = {
      gte: query.endDateFrom,
      lte: query.endDateTo,
    };
  }

  return where;
}

export async function getAdminSummaryReport(authUser: AuthUser) {
  const cacheKey = `admin:summary:${authUser.id}`;
  const cached = getCacheValue<{
    totalContracts: number;
    activeContracts: number;
    expiringSoonContracts: number;
    expiredContracts: number;
    pendingApprovalContracts: number;
    approvedContracts: number;
    rejectedContracts: number;
    autoRenewContracts: number;
    totalUsers: number;
    activeUsers: number;
    pendingReminderJobs: number;
    failedReminderJobs: number;
    deadLetterReminderJobs: number;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const expiringSoonBoundary = addDaysUtc(endOfUtcDay(now), 7);

  const [
    totalContracts,
    activeContracts,
    expiringSoonContracts,
    expiredContracts,
    pendingApprovalContracts,
    approvedContracts,
    rejectedContracts,
    autoRenewContracts,
    totalUsers,
    activeUsers,
    pendingReminderJobs,
    failedReminderJobs,
    deadLetterReminderJobs,
  ] = await Promise.all([
    prisma.contract.count(),
    prisma.contract.count({ where: { status: ContractStatus.ACTIVE } }),
    prisma.contract.count({ where: { endDate: { gte: todayStart, lte: expiringSoonBoundary } } }),
    prisma.contract.count({ where: { endDate: { lt: todayStart } } }),
    prisma.contract.count({ where: { approvalStatus: ApprovalStatus.PENDING } }),
    prisma.contract.count({ where: { approvalStatus: ApprovalStatus.APPROVED } }),
    prisma.contract.count({ where: { approvalStatus: ApprovalStatus.REJECTED } }),
    prisma.contract.count({ where: { autoRenew: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.reminderJob.count({ where: { status: ReminderJobStatus.PENDING } }),
    prisma.reminderJob.count({ where: { status: ReminderJobStatus.FAILED } }),
    prisma.reminderJob.count({ where: { status: ReminderJobStatus.DEAD_LETTER } }),
  ]);

  await createAuditLog({
    userId: authUser.id,
    action: "VIEW_ADMIN_REPORT_SUMMARY",
    entityType: "REPORT",
    entityId: "admin-summary",
  });

  const result = {
    totalContracts,
    activeContracts,
    expiringSoonContracts,
    expiredContracts,
    pendingApprovalContracts,
    approvedContracts,
    rejectedContracts,
    autoRenewContracts,
    totalUsers,
    activeUsers,
    pendingReminderJobs,
    failedReminderJobs,
    deadLetterReminderJobs,
  };
  setCacheValue(cacheKey, result, 30_000);
  return result;
}

export async function getContractsReport(query: ContractsReportQuery) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 50, 1), 200);
  const skip = (page - 1) * pageSize;
  const where = buildContractsReportWhere(query);
  const orderBy = { [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc" } as Prisma.ContractOrderByWithRelationInput;

  const cacheKey = toCacheKey("reports:contracts:list", {
    query: { ...query, page, pageSize },
  });
  const cached = getCacheValue<{
    items: Array<Record<string, unknown>>;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const [items, total] = await prisma.$transaction([
    prisma.contract.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        owner: {
          select: { id: true, name: true, email: true, role: true, status: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.contract.count({ where }),
  ]);

  const result = {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
  setCacheValue(cacheKey, result, 10_000);
  return result;
}

export async function exportContractsReportCsv(query: ContractsReportQuery, authUser: AuthUser) {
  const maxRows = Number(process.env.REPORT_EXPORT_MAX_ROWS ?? "5000");
  const where = buildContractsReportWhere(query);
  const orderBy = { [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc" } as Prisma.ContractOrderByWithRelationInput;

  const items = await prisma.contract.findMany({
    where,
    orderBy,
    take: maxRows,
    include: {
      owner: {
        select: { name: true, email: true },
      },
      approvedBy: {
        select: { name: true, email: true },
      },
    },
  });

  const headers = [
    "Code",
    "Title",
    "Partner Name",
    "Partner Email",
    "Owner Name",
    "Status",
    "Approval Status",
    "Start Date",
    "End Date",
    "Value",
    "Auto Renew",
    "Approved At",
    "Approved By",
    "Rejection Reason",
    "Created At",
    "Updated At",
  ];

  const rows = items.map((item) => [
    item.code,
    item.title,
    item.partnerName,
    item.partnerEmail,
    item.owner.name,
    item.status,
    item.approvalStatus,
    item.startDate.toISOString(),
    item.endDate.toISOString(),
    item.value,
    item.autoRenew,
    item.approvedAt?.toISOString(),
    item.approvedBy?.name ?? item.approvedBy?.email,
    item.rejectionReason,
    item.createdAt.toISOString(),
    item.updatedAt.toISOString(),
  ]);

  await createAuditLog({
    userId: authUser.id,
    action: "EXPORT_CONTRACT_REPORT",
    entityType: "REPORT",
    entityId: "contracts-export",
    metadata: {
      totalRows: rows.length,
      maxRows,
    },
  });

  return buildCsv(headers, rows);
}
