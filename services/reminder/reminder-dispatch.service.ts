import { NotificationEntityType, NotificationType, ReminderSendStatus, type ReminderType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit.service";
import { sendReminderEmail } from "@/services/mail.service";
import { createNotification } from "@/services/notification.service";

type DispatchInput = {
  contractId: string;
  recipientEmail: string;
  reminderType: ReminderType;
  reminderThresholdDays: number | null;
  contractCode: string;
  contractTitle: string;
  endDate: Date;
  triggeredByUserId?: string;
};

export async function sendReminderEmailForJob(input: DispatchInput) {
  const contract = await prisma.contract.findUnique({
    where: { id: input.contractId },
    select: {
      ownerId: true,
      partnerName: true,
    },
  });

  const sendResult = await sendReminderEmail({
    to: input.recipientEmail,
    reminderType: input.reminderType,
    reminderThresholdDays: input.reminderThresholdDays,
    contractCode: input.contractCode,
    contractTitle: input.contractTitle,
    partnerName: contract?.partnerName ?? "Partner",
    endDate: input.endDate,
  });

  const status = sendResult.success ? ReminderSendStatus.SENT : ReminderSendStatus.FAILED;

  await prisma.reminderLog.create({
    data: {
      contractId: input.contractId,
      reminderType: input.reminderType,
      reminderThresholdDays: input.reminderThresholdDays,
      sentTo: input.recipientEmail,
      status,
      sentAt: sendResult.success ? new Date() : null,
      message: sendResult.success ? "Reminder email sent successfully" : sendResult.errorMessage ?? "Failed to send reminder email",
    },
  });

  if (contract?.ownerId) {
    if (sendResult.success) {
      await createNotification({
        userId: contract.ownerId,
        type: input.reminderType === "EXPIRED" ? NotificationType.CONTRACT_EXPIRED : NotificationType.CONTRACT_EXPIRING,
        title: input.reminderType === "EXPIRED" ? "Contract expired" : "Contract expiring soon",
        message:
          input.reminderType === "EXPIRED"
            ? `Reminder email sent for expired contract ${input.contractCode}.`
            : `Reminder ${input.reminderThresholdDays ?? 0} days before expiry sent for contract ${input.contractCode}.`,
        relatedEntityType: NotificationEntityType.CONTRACT,
        relatedEntityId: input.contractId,
      });
    } else {
      await createNotification({
        userId: contract.ownerId,
        type: NotificationType.REMINDER_FAILED,
        title: "Reminder email failed",
        message: `Failed to send ${input.reminderType} reminder for contract ${input.contractCode}.`,
        relatedEntityType: NotificationEntityType.CONTRACT,
        relatedEntityId: input.contractId,
      });
    }
  }

  await createAuditLog({
    userId: input.triggeredByUserId,
    action: sendResult.success ? "SEND_REMINDER_EMAIL" : "FAIL_REMINDER_EMAIL",
    entityType: "CONTRACT",
    entityId: input.contractId,
    metadata: {
      reminderType: input.reminderType,
      reminderThresholdDays: input.reminderThresholdDays,
      sentTo: input.recipientEmail,
      status,
      error: sendResult.success ? undefined : sendResult.errorMessage,
    },
  });

  return {
    success: sendResult.success,
    errorMessage: sendResult.errorMessage,
  };
}
