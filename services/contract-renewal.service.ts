import { ContractStatus, NotificationEntityType, NotificationType } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit.service";
import { sendContractRenewedEmail } from "@/services/mail.service";
import { createNotification } from "@/services/notification.service";
import { assertContractAccessById } from "@/services/contract.service";
import type { AuthUser } from "@/types/auth";
import type { RenewContractInput } from "@/types/renewal";

function generateRenewedContractCode(sourceCode: string, version: number) {
  return `${sourceCode}-R${version}`;
}

async function getNextRenewalVersion(contractId: string): Promise<number> {
  const latest = await prisma.contract.findFirst({
    where: { parentContractId: contractId },
    orderBy: { renewalVersion: "desc" },
    select: { renewalVersion: true },
  });
  return (latest?.renewalVersion ?? 1) + 1;
}

export async function renewContract(contractId: string, input: RenewContractInput, authUser: AuthUser) {
  const source = await assertContractAccessById(contractId, authUser);

  const duplicateRenewal = await prisma.contract.findFirst({
    where: {
      parentContractId: source.id,
      startDate: input.startDate,
      endDate: input.endDate,
    },
    select: { id: true, code: true },
  });
  if (duplicateRenewal) {
    throw new AppError("A renewal contract with the same date range already exists", 409, "CONFLICT");
  }

  const renewalVersion = await getNextRenewalVersion(contractId);
  const renewedCode = generateRenewedContractCode(source.code, renewalVersion);

  const existingCode = await prisma.contract.findUnique({ where: { code: renewedCode }, select: { id: true } });
  if (existingCode) {
    throw new AppError("Renewed contract code already exists", 409, "CONFLICT");
  }

  const renewed = await prisma.contract.create({
    data: {
      code: renewedCode,
      title: input.title ?? source.title,
      partnerName: input.partnerName ?? source.partnerName,
      partnerEmail: input.partnerEmail ?? source.partnerEmail ?? undefined,
      description: input.description ?? source.description ?? undefined,
      value: input.value ?? source.value,
      startDate: input.startDate,
      endDate: input.endDate,
      signedDate: input.signedDate,
      status: input.status ?? ContractStatus.DRAFT,
      renewalReminderDays: input.renewalReminderDays ?? source.renewalReminderDays,
      autoRenew: input.autoRenew ?? source.autoRenew,
      fileUrl: source.fileUrl,
      fileName: source.fileName,
      originalFileName: source.originalFileName,
      fileMimeType: source.fileMimeType,
      fileSize: source.fileSize,
      uploadedAt: source.uploadedAt,
      note: input.note ?? source.note ?? undefined,
      ownerId: source.ownerId,
      parentContractId: source.id,
      renewalVersion,
      renewedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: authUser.id,
    action: "RENEW_CONTRACT",
    entityType: "CONTRACT",
    entityId: renewed.id,
    metadata: {
      previousContractId: source.id,
      renewedCode: renewed.code,
      renewalVersion,
    },
  });

  await createNotification({
    userId: source.ownerId,
    type: NotificationType.CONTRACT_RENEWED,
    title: "Contract renewed",
    message: `Contract ${source.code} has been renewed as ${renewed.code}.`,
    relatedEntityType: NotificationEntityType.CONTRACT,
    relatedEntityId: renewed.id,
  });

  if (source.partnerEmail) {
    const emailResult = await sendContractRenewedEmail({
      to: source.partnerEmail,
      previousCode: source.code,
      renewedCode: renewed.code,
      renewedTitle: renewed.title,
      startDate: renewed.startDate,
      endDate: renewed.endDate,
    });

    await createAuditLog({
      userId: authUser.id,
      action: emailResult.success ? "SEND_RENEWAL_EMAIL" : "FAIL_RENEWAL_EMAIL",
      entityType: "CONTRACT",
      entityId: renewed.id,
      metadata: {
        to: source.partnerEmail,
        success: emailResult.success,
      },
    });
  }

  return {
    previousContractId: source.id,
    renewedContractId: renewed.id,
    renewedContractCode: renewed.code,
    startDate: renewed.startDate,
    endDate: renewed.endDate,
  };
}
