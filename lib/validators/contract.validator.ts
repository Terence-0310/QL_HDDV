import { ContractStatus } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

const dateFromString = z
  .string()
  .trim()
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), "Invalid date");

const optionalDateFromStringForQuery = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (!value) {
      return undefined;
    }
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

const optionalDateFromString = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (!value) {
      return undefined;
    }

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

const contractBaseSchema = z.object({
  code: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(255),
  partnerName: z.string().trim().min(1).max(255),
  partnerEmail: z.string().trim().toLowerCase().email().optional(),
  description: z.string().trim().max(2000).optional(),
  value: z.number().nonnegative(),
  startDate: dateFromString,
  endDate: dateFromString,
  signedDate: optionalDateFromString,
  status: z.nativeEnum(ContractStatus).optional(),
  renewalReminderDays: z.number().int().min(0).max(365).optional(),
  reminderThresholdDays: z.array(z.number().int().min(1).max(365)).min(1).max(10).optional(),
  autoRenew: z.boolean().optional(),
  fileUrl: z.string().trim().url().optional(),
  note: z.string().trim().max(2000).optional(),
});

export const createContractSchema = contractBaseSchema.superRefine((value, ctx) => {
  if (value.endDate < value.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endDate must not be earlier than startDate",
      path: ["endDate"],
    });
  }
});

export const updateContractSchema = contractBaseSchema
  .partial()
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endDate must not be earlier than startDate",
        path: ["endDate"],
      });
    }
  });

export const contractListQuerySchema = z.object({
  search: optionalTrimmedString,
  status: z.nativeEnum(ContractStatus).optional(),
  ownerId: optionalTrimmedString,
  autoRenew: z
    .union([z.literal("true"), z.literal("false"), z.boolean(), z.undefined()])
    .transform((value) => {
      if (value === undefined) return undefined;
      if (typeof value === "boolean") return value;
      return value === "true";
    }),
  startDateFrom: optionalDateFromStringForQuery,
  startDateTo: optionalDateFromStringForQuery,
  endDateFrom: optionalDateFromStringForQuery,
  endDateTo: optionalDateFromStringForQuery,
  sortBy: z.enum(["createdAt", "updatedAt", "endDate", "title", "value"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).superRefine((value, ctx) => {
  if (value.startDateFrom && value.startDateTo && value.startDateFrom > value.startDateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "startDateFrom must be earlier than or equal to startDateTo",
      path: ["startDateFrom"],
    });
  }
  if (value.endDateFrom && value.endDateTo && value.endDateFrom > value.endDateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endDateFrom must be earlier than or equal to endDateTo",
      path: ["endDateFrom"],
    });
  }
});

export type CreateContractPayload = z.infer<typeof createContractSchema>;
export type UpdateContractPayload = z.infer<typeof updateContractSchema>;
export type ContractListQueryPayload = z.infer<typeof contractListQuerySchema>;
