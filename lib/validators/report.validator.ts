import { ApprovalStatus, ContractStatus, UserStatus } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

const optionalDate = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value, ctx) => {
    if (typeof value !== "string" || value.trim() === "") return undefined;
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

export const reportContractsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    search: optionalTrimmedString,
    status: z.nativeEnum(ContractStatus).optional(),
    approvalStatus: z.nativeEnum(ApprovalStatus).optional(),
    ownerId: optionalTrimmedString,
    startDateFrom: optionalDate,
    startDateTo: optionalDate,
    endDateFrom: optionalDate,
    endDateTo: optionalDate,
    sortBy: z.enum(["createdAt", "updatedAt", "endDate", "title", "value"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .superRefine((value, ctx) => {
    if (value.startDateFrom && value.startDateTo && value.startDateFrom > value.startDateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDateFrom"],
        message: "startDateFrom must be earlier than or equal to startDateTo",
      });
    }
    if (value.endDateFrom && value.endDateTo && value.endDateFrom > value.endDateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDateFrom"],
        message: "endDateFrom must be earlier than or equal to endDateTo",
      });
    }
  });

export const reportSummaryQuerySchema = z.object({
  ownerId: optionalTrimmedString,
});

export const reportUserSummaryQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
});
