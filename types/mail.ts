export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type MailSendResult = {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
};
