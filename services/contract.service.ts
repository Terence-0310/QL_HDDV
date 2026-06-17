import { Prisma, UserRole, type Contract } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue, invalidateCacheByPrefix, withCache } from "@/lib/simple-cache";
import { toCacheKey } from "@/lib/cache-key";
import { buildPaginationOptions, buildContractWhereClause, buildPaginationResult } from "@/lib/query-builder";
import { AppError } from "@/lib/errors";
import { createAuditLog } from "@/services/audit.service";
import type { AuthUser } from "@/types/auth";
import type { ContractListResult, CreateContractInput, ListContractsInput, UpdateContractInput } from "@/types/contract";

type ContractListItem = Contract;

function normalizeReminderThresholdDays(input?: number[]): string | undefined {
  if (!input || input.length === 0) return undefined;
  const unique = Array.from(new Set(input.filter((value) => Number.isInteger(value) && value > 0))).sort((a, b) => b - a);
  if (!unique.length) return undefined;
  return unique.join(",");
}

function mapContractResponse(contract: Contract): Contract {
  return contract;
}

function assertContractAccess(contractOwnerId: string, authUser: AuthUser) {
  if (authUser.role === UserRole.ADMIN || authUser.role === UserRole.SUPER_ADMIN) return;
  if (contractOwnerId !== authUser.id) {
    throw new AppError("You do not have access to this contract", 403, "FORBIDDEN");
  }
}

export async function assertContractAccessById(contractId: string, authUser: AuthUser): Promise<Contract> {
  const existing = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!existing) throw new AppError("Contract not found", 404, "NOT_FOUND");
  assertContractAccess(existing.ownerId, authUser);
  return existing;
}

function buildContractListWhereClause(input: ListContractsInput, authUser: AuthUser): Prisma.ContractWhereInput {
  const isAdmin = authUser.role === UserRole.ADMIN || authUser.role === UserRole.SUPER_ADMIN;
  return buildContractWhereClause({
    ...input,
    ownerId: isAdmin ? input.ownerId : authUser.id,
  });
}

function buildContractListOrderBy(
  input: ListContractsInput,
): Prisma.ContractOrderByWithRelationInput {
  const sortBy = input.sortBy ?? "createdAt";
  const sortOrder = input.sortOrder ?? "desc";
  return { [sortBy]: sortOrder };
}

function handleContractServiceError(error: unknown): never {
  if (error instanceof AppError) throw error;
  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002") {
    throw new AppError("Contract code already exists", 409, "CONFLICT");
  }
  throw new AppError("Unable to process contract request", 500, "INTERNAL_ERROR");
}

export async function createContract(input: CreateContractInput, authUser: AuthUser): Promise<Contract> {
  try {
    const ownerId = (authUser.role === UserRole.ADMIN || authUser.role === UserRole.SUPER_ADMIN) && input.ownerId ? input.ownerId : authUser.id;
    const { reminderThresholdDays, ...restInput } = input;
    const reminderOffsets = normalizeReminderThresholdDays(input.reminderThresholdDays);
    const created = await prisma.contract.create({
      data: {
        ...restInput,
        ownerId,
        code: restInput.code.trim(),
        renewalReminderDays: input.renewalReminderDays ?? 7,
        reminderOffsets: reminderOffsets ?? "7,15,30",
        autoRenew: input.autoRenew ?? false,
      },
    });

    await createAuditLog({
      userId: authUser.id,
      action: "CONTRACT_CREATE",
      entityType: "CONTRACT",
      entityId: created.id,
      metadata: { code: created.code, ownerId: created.ownerId },
    });

    invalidateCacheByPrefix("contracts:list");
    invalidateCacheByPrefix("admin:contracts:list");

    return mapContractResponse(created);
  } catch (error) {
    handleContractServiceError(error);
  }
}

export async function updateContract(contractId: string, input: UpdateContractInput, authUser: AuthUser): Promise<Contract> {
  try {
    await assertContractAccessById(contractId, authUser);
    const { reminderThresholdDays, ...restInput } = input;
    const reminderOffsets = normalizeReminderThresholdDays(input.reminderThresholdDays);

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        ...restInput,
        code: restInput.code?.trim(),
        reminderOffsets,
      },
    });

    await createAuditLog({
      userId: authUser.id,
      action: "CONTRACT_UPDATE",
      entityType: "CONTRACT",
      entityId: updated.id,
      metadata: { code: updated.code },
    });

    invalidateCacheByPrefix("contracts:list");
    invalidateCacheByPrefix("admin:contracts:list");

    return mapContractResponse(updated);
  } catch (error) {
    handleContractServiceError(error);
  }
}

export async function deleteContract(contractId: string, authUser: AuthUser): Promise<void> {
  try {
    const existing = await assertContractAccessById(contractId, authUser);

    const deleted = await prisma.contract.delete({ where: { id: contractId } });
    await createAuditLog({
      userId: authUser.id,
      action: "CONTRACT_DELETE",
      entityType: "CONTRACT",
      entityId: deleted.id,
      metadata: { code: deleted.code },
    });

    invalidateCacheByPrefix("contracts:list");
    invalidateCacheByPrefix("admin:contracts:list");
  } catch (error) {
    handleContractServiceError(error);
  }
}

export async function getContractById(contractId: string, authUser: AuthUser) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      approvedBy: { select: { id: true, name: true, email: true, role: true } },
      parentContract: { select: { id: true, code: true, title: true } },
      renewedContracts: {
        select: { id: true, code: true, title: true, renewalVersion: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      reminderLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!contract) throw new AppError("Contract not found", 404, "NOT_FOUND");
  assertContractAccess(contract.ownerId, authUser);
  return {
    id: contract.id,
    code: contract.code,
    title: contract.title,
    partnerName: contract.partnerName,
    partnerEmail: contract.partnerEmail,
    description: contract.description,
    value: contract.value,
    startDate: contract.startDate,
    endDate: contract.endDate,
    signedDate: contract.signedDate,
    status: contract.status,
    renewalReminderDays: contract.renewalReminderDays,
    autoRenew: contract.autoRenew,
    note: contract.note,
    fileUrl: contract.fileUrl,
    fileName: contract.fileName,
    originalFileName: contract.originalFileName,
    fileMimeType: contract.fileMimeType,
    fileSize: contract.fileSize,
    uploadedAt: contract.uploadedAt,
    parentContract: contract.parentContract,
    renewalVersion: contract.renewalVersion,
    renewedAt: contract.renewedAt,
    approvalStatus: contract.approvalStatus,
    submittedForApprovalAt: contract.submittedForApprovalAt,
    approvedAt: contract.approvedAt,
    rejectedAt: contract.rejectedAt,
    rejectionReason: contract.rejectionReason,
    approvedBy: contract.approvedBy,
    renewedContracts: contract.renewedContracts,
    owner: contract.owner,
    reminderSummary: {
      totalLogs: contract.reminderLogs.length,
      latestLogAt: contract.reminderLogs[0]?.createdAt ?? null,
    },
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export async function listContracts(
  input: ListContractsInput,
  authUser: AuthUser,
): Promise<ContractListResult<ContractListItem>> {
  const { page, pageSize, skip } = buildPaginationOptions(input.page, input.pageSize);
  const where = buildContractListWhereClause(input, authUser);

  const cacheKey = toCacheKey("contracts:list", { authUserId: authUser.id, role: authUser.role, input: { ...input, page, pageSize } });

  return withCache(cacheKey, 10_000, async () => {
    const [items, total] = await prisma.$transaction([
      prisma.contract.findMany({
        where,
        orderBy: buildContractListOrderBy(input),
        skip,
        take: pageSize,
      }),
      prisma.contract.count({ where }),
    ]);

    const mappedItems = items.map(mapContractResponse);
    return buildPaginationResult(mappedItems, total, page, pageSize);
  });
}

export async function updateContractFileMetadata(
  contractId: string,
  input: Pick<
    Contract,
    "fileUrl" | "fileName" | "originalFileName" | "fileMimeType" | "fileSize" | "uploadedAt"
  >,
) {
  return prisma.contract.update({
    where: { id: contractId },
    data: input,
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      originalFileName: true,
      fileMimeType: true,
      fileSize: true,
      uploadedAt: true,
    },
  });
}
