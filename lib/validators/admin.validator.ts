import { UserRole, UserStatus, ContractStatus } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: optionalTrimmedString,
});

export const adminUpdateUserSchema = z
  .object({
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((value) => value.role !== undefined || value.status !== undefined, {
    message: "At least one field (role or status) must be provided",
  });

export const adminCreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
});

export const adminContractsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(ContractStatus).optional(),
  ownerId: optionalTrimmedString,
  search: optionalTrimmedString,
  sortBy: z.enum(["createdAt", "updatedAt", "endDate", "title", "value"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
