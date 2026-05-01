import { ApprovalStatus, Prisma, UserStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue } from "@/lib/simple-cache";
import { toCacheKey } from "@/lib/cache-key";
import { createAuditLog } from "@/services/audit.service";
import type { AuthUser } from "@/types/auth";
import type { AdminUserListQuery } from "@/types/admin";

export async function listUsers(query: AdminUserListQuery) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
  const skip = (page - 1) * pageSize;
  const cacheKey = toCacheKey("admin:users:list", { query: { ...query, page, pageSize } });
  const cached = getCacheValue<{
    items: Array<{
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "STAFF" | "USER";
      status: "ACTIVE" | "INACTIVE" | "BLOCKED";
      createdAt: Date;
      updatedAt: Date;
    }>;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const where: Prisma.UserWhereInput = {
    role: query.role,
    status: query.status,
    OR: query.search
      ? [
          { name: { contains: query.search } },
          { email: { contains: query.search } },
        ]
      : undefined,
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
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

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          contracts: true,
          notifications: true,
        },
      },
    },
  });

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  return user;
}

export async function updateUser(
  userId: string,
  input: { role?: "ADMIN" | "STAFF" | "USER"; status?: "ACTIVE" | "INACTIVE" | "BLOCKED" },
  authUser: AuthUser,
) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!existing) throw new AppError("User not found", 404, "NOT_FOUND");

  if (existing.id === authUser.id && input.status && input.status !== UserStatus.ACTIVE) {
    throw new AppError("You cannot deactivate or block your own account", 409, "CONFLICT");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      role: input.role,
      status: input.status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  if (input.role && input.role !== existing.role) {
    await createAuditLog({
      userId: authUser.id,
      action: "UPDATE_USER_ROLE",
      entityType: "USER",
      entityId: userId,
      metadata: { from: existing.role, to: input.role },
    });
  }

  if (input.status && input.status !== existing.status) {
    await createAuditLog({
      userId: authUser.id,
      action: "UPDATE_USER_STATUS",
      entityType: "USER",
      entityId: userId,
      metadata: { from: existing.status, to: input.status },
    });
  }

  return updated;
}

export async function listAdminContracts(query: {
  page?: number;
  pageSize?: number;
  status?: string;
  ownerId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "endDate" | "title" | "value";
  sortOrder?: "asc" | "desc";
}) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
  const skip = (page - 1) * pageSize;
  const cacheKey = toCacheKey("admin:contracts:list", { query: { ...query, page, pageSize } });
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

  const where: Prisma.ContractWhereInput = {
    status: query.status as Prisma.EnumContractStatusFilter["equals"] | undefined,
    ownerId: query.ownerId,
    OR: query.search
      ? [
          { title: { contains: query.search } },
          { code: { contains: query.search } },
          { partnerName: { contains: query.search } },
          { partnerEmail: { contains: query.search } },
        ]
      : undefined,
  };

  const orderBy = { [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc" } as Prisma.ContractOrderByWithRelationInput;

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

export async function listPendingApprovals(query: {
  page?: number;
  pageSize?: number;
  ownerId?: string;
  search?: string;
  status?: string;
  sortBy?: "submittedForApprovalAt" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
  const skip = (page - 1) * pageSize;
  const cacheKey = toCacheKey("admin:approvals:list", { query: { ...query, page, pageSize } });
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

  const where: Prisma.ContractWhereInput = {
    approvalStatus: ApprovalStatus.PENDING,
    status: query.status as Prisma.EnumContractStatusFilter["equals"] | undefined,
    ownerId: query.ownerId,
    OR: query.search
      ? [
          { title: { contains: query.search } },
          { code: { contains: query.search } },
          { partnerName: { contains: query.search } },
        ]
      : undefined,
  };
  const orderBy = { [query.sortBy ?? "submittedForApprovalAt"]: query.sortOrder ?? "desc" } as Prisma.ContractOrderByWithRelationInput;

  const [items, total] = await prisma.$transaction([
    prisma.contract.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        owner: {
          select: { id: true, name: true, email: true, role: true },
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
