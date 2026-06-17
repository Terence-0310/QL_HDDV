import { ApprovalStatus, Prisma, UserStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue, invalidateCacheByPrefix, withCache } from "@/lib/simple-cache";
import { toCacheKey } from "@/lib/cache-key";
import { createAuditLog } from "@/services/audit.service";
import { hashPassword } from "@/lib/password";
import type { AuthUser } from "@/types/auth";
import type { AdminUserListQuery } from "@/types/admin";
import { buildPaginationOptions, buildContractWhereClause, buildPaginationResult } from "@/lib/query-builder";
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
      role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "USER";
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
  input: { role?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "USER"; status?: "ACTIVE" | "INACTIVE" | "BLOCKED" },
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

  if (input.role === "SUPER_ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("Only Super Admins can assign the SUPER_ADMIN role", 403, "FORBIDDEN");
  }

  if (input.role && existing.role === "SUPER_ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("You cannot change the role of a Super Admin", 403, "FORBIDDEN");
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

  invalidateCacheByPrefix("admin:users:list");
  return updated;
}

export async function deleteUser(userId: string, authUser: AuthUser) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!existing) throw new AppError("User not found", 404, "NOT_FOUND");

  if (existing.id === authUser.id) {
    throw new AppError("You cannot delete your own account", 409, "CONFLICT");
  }

  if (existing.role === "SUPER_ADMIN") {
    throw new AppError("Cannot delete a Super Admin account", 403, "FORBIDDEN");
  }

  if (existing.role === "ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("Only Super Admins can delete other Admins", 403, "FORBIDDEN");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  await createAuditLog({
    userId: authUser.id,
    action: "DELETE_USER",
    entityType: "USER",
    entityId: userId,
    metadata: { role: existing.role },
  });

  invalidateCacheByPrefix("admin:users:list");
  return { success: true };
}

export async function createUser(
  input: { name: string; email: string; password: string; role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "USER"; status: "ACTIVE" | "INACTIVE" | "BLOCKED" },
  authUser: AuthUser,
) {
  if (input.role === "SUPER_ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("Only Super Admins can create a SUPER_ADMIN", 403, "FORBIDDEN");
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("Email đã tồn tại", 409, "EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);
  
  const created = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      status: input.status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    userId: authUser.id,
    action: "CREATE_USER",
    entityType: "USER",
    entityId: created.id,
    metadata: { role: created.role, email: created.email },
  });

  invalidateCacheByPrefix("admin:users:list");
  return created;
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
  const { page, pageSize, skip } = buildPaginationOptions(query.page, query.pageSize);
  const cacheKey = toCacheKey("admin:contracts:list", { query: { ...query, page, pageSize } });
  
  return withCache(cacheKey, 10_000, async () => {
    const where = buildContractWhereClause(query);
    const orderBy = { [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc" } as Prisma.ContractOrderByWithRelationInput;

    const [items, total] = await prisma.$transaction([
      prisma.contract.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, email: true, role: true, status: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  });
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
