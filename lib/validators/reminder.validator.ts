import { z } from "zod";

export const reminderPreviewQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const reminderRunBodySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type ReminderPreviewQuery = z.infer<typeof reminderPreviewQuerySchema>;
export type ReminderRunBody = z.infer<typeof reminderRunBodySchema>;
