import { ContractStatus } from "@prisma/client";
import { z } from "zod";

const dateFromString = z
  .string()
  .trim()
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), "Invalid date");

const optionalDateFromString = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date",
      });
      return z.NEVER;
    }
    return date;
  });

export const renewContractSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    partnerName: z.string().trim().min(1).max(255).optional(),
    partnerEmail: z.string().trim().toLowerCase().email().optional(),
    description: z.string().trim().max(2000).optional(),
    value: z.number().positive().optional(),
    startDate: dateFromString,
    endDate: dateFromString,
    signedDate: optionalDateFromString,
    autoRenew: z.boolean().optional(),
    renewalReminderDays: z.number().int().min(0).max(365).optional(),
    note: z.string().trim().max(2000).optional(),
    status: z.nativeEnum(ContractStatus).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endDate must not be earlier than startDate",
        path: ["endDate"],
      });
    }
  });
