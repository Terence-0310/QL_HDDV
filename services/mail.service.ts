import { ReminderType } from "@prisma/client";
import { sendMailWithProvider } from "@/lib/mail/provider";
import { contractExpiredTemplate } from "@/lib/mail/templates/contract-expired";
import { contractExpiringTemplate } from "@/lib/mail/templates/contract-expiring";
import { contractRenewedTemplate } from "@/lib/mail/templates/contract-renewed";
import type { MailSendResult } from "@/types/mail";

export async function sendReminderEmail(input: {
  to: string;
  reminderType: ReminderType;
  contractCode: string;
  contractTitle: string;
  partnerName: string;
  endDate: Date;
  reminderThresholdDays?: number | null;
}): Promise<MailSendResult> {
  if (!input.to) {
    return { success: false, errorMessage: "Recipient email is missing" };
  }

  if (input.reminderType === ReminderType.EXPIRED) {
    const template = contractExpiredTemplate(input);
    return sendMailWithProvider({ to: input.to, ...template });
  }

  const template = contractExpiringTemplate(input);
  return sendMailWithProvider({ to: input.to, ...template });
}

export async function sendContractRenewedEmail(input: {
  to: string;
  previousCode: string;
  renewedCode: string;
  renewedTitle: string;
  startDate: Date;
  endDate: Date;
}): Promise<MailSendResult> {
  const template = contractRenewedTemplate(input);
  return sendMailWithProvider({ to: input.to, ...template });
}
