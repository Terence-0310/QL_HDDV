import nodemailer from "nodemailer";
import type { MailPayload, MailSendResult } from "@/types/mail";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;

  if (!host || !port || !from) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
  };
}

export async function sendMailWithProvider(payload: MailPayload): Promise<MailSendResult> {
  const config = getSmtpConfig();
  if (!config) {
    return {
      success: false,
      errorMessage: "Mail provider is not configured",
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  });

  try {
    const result = await transporter.sendMail({
      from: config.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return {
      success: true,
      providerMessageId: result.messageId,
    };
  } catch {
    return {
      success: false,
      errorMessage: "Failed to send email through SMTP provider",
    };
  }
}
