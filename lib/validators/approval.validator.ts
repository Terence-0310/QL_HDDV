import { ContractStatus } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const rejectContractSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const approvalQueueQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  ownerId: optionalTrimmedString,
  search: optionalTrimmedString,
  status: z.nativeEnum(ContractStatus).optional(),
  sortBy: z.enum(["submittedForApprovalAt", "updatedAt", "createdAt"]).default("submittedForApprovalAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
