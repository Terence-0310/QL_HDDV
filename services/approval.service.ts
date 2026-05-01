import { ApprovalStatus, ContractStatus, NotificationEntityType, NotificationType } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { invalidateCacheByPrefix } from "@/lib/simple-cache";
import { createAuditLog } from "@/services/audit.service";
import { createNotification } from "@/services/notification.service";
import { assertContractAccessById } from "@/services/contract.service";
import type { AuthUser } from "@/types/auth";

function assertCanSubmitForApproval(status: ApprovalStatus) {
  if (status === ApprovalStatus.PENDING) {
    throw new AppError("Contract is already pending approval", 409, "CONFLICT");
  }
  if (status === ApprovalStatus.APPROVED) {
    throw new AppError("Approved contract cannot be resubmitted for approval", 409, "CONFLICT");
  }
}

function assertCanApprove(status: ApprovalStatus) {
  if (status !== ApprovalStatus.PENDING) {
    throw new AppError("Only pending approval contracts can be approved", 409, "CONFLICT");
  }
}

function assertCanReject(status: ApprovalStatus) {
  if (status !== ApprovalStatus.PENDING) {
    throw new AppError("Only pending approval contracts can be rejected", 409, "CONFLICT");
  }
}

export async function submitForApproval(contractId: string, authUser: AuthUser) {
  const contract = await assertContractAccessById(contractId, authUser);
  assertCanSubmitForApproval(contract.approvalStatus);

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      approvalStatus: ApprovalStatus.PENDING,
      submittedForApprovalAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  const stepCount = await prisma.contractApprovalHistory.count({ where: { contractId } });
  await prisma.contractApprovalHistory.create({
    data: {
      contractId,
      actorId: authUser.id,
      action: "SUBMIT",
      step: stepCount + 1,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: "Contract pending approval",
        message: `Contract ${updated.code} has been submitted for approval.`,
        relatedEntityType: NotificationEntityType.CONTRACT,
        relatedEntityId: updated.id,
      }),
    ),
  );

  await createAuditLog({
    userId: authUser.id,
    action: "SUBMIT_CONTRACT_FOR_APPROVAL",
    entityType: "CONTRACT",
    entityId: updated.id,
    metadata: {
      code: updated.code,
    },
  });

  invalidateCacheByPrefix("contracts:list");
  invalidateCacheByPrefix("admin:contracts:list");

  return updated;
}

export async function approveContract(contractId: string, authUser: AuthUser) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw new AppError("Contract not found", 404, "NOT_FOUND");
  assertCanApprove(contract.approvalStatus);

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: authUser.id,
      rejectedAt: null,
      rejectionReason: null,
      status: contract.status === ContractStatus.DRAFT ? ContractStatus.ACTIVE : contract.status,
    },
  });

  const stepCount = await prisma.contractApprovalHistory.count({ where: { contractId } });
  await prisma.contractApprovalHistory.create({
    data: {
      contractId,
      actorId: authUser.id,
      action: "APPROVE",
      step: stepCount + 1,
    },
  });

  await createNotification({
    userId: updated.ownerId,
    type: NotificationType.SYSTEM,
    title: "Contract approved",
    message: `Contract ${updated.code} has been approved.`,
    relatedEntityType: NotificationEntityType.CONTRACT,
    relatedEntityId: updated.id,
  });

  await createAuditLog({
    userId: authUser.id,
    action: "APPROVE_CONTRACT",
    entityType: "CONTRACT",
    entityId: updated.id,
    metadata: {
      code: updated.code,
    },
  });

  invalidateCacheByPrefix("contracts:list");
  invalidateCacheByPrefix("admin:contracts:list");

  return updated;
}

export async function rejectContract(contractId: string, reason: string, authUser: AuthUser) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw new AppError("Contract not found", 404, "NOT_FOUND");
  assertCanReject(contract.approvalStatus);

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      rejectedAt: new Date(),
      rejectionReason: reason,
      approvedAt: null,
      approvedById: null,
    },
  });

  const stepCount = await prisma.contractApprovalHistory.count({ where: { contractId } });
  await prisma.contractApprovalHistory.create({
    data: {
      contractId,
      actorId: authUser.id,
      action: "REJECT",
      reason,
      step: stepCount + 1,
    },
  });

  await createNotification({
    userId: updated.ownerId,
    type: NotificationType.SYSTEM,
    title: "Contract rejected",
    message: `Contract ${updated.code} was rejected. Reason: ${reason}`,
    relatedEntityType: NotificationEntityType.CONTRACT,
    relatedEntityId: updated.id,
  });

  await createAuditLog({
    userId: authUser.id,
    action: "REJECT_CONTRACT",
    entityType: "CONTRACT",
    entityId: updated.id,
    metadata: {
      code: updated.code,
      reason,
    },
  });

  invalidateCacheByPrefix("contracts:list");
  invalidateCacheByPrefix("admin:contracts:list");

  return updated;
}

export async function getApprovalHistory(contractId: string, authUser: AuthUser) {
  await assertContractAccessById(contractId, authUser);
  return prisma.contractApprovalHistory.findMany({
    where: { contractId },
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
