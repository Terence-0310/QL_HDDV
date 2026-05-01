import type { UserRole, UserStatus } from "@prisma/client";

export type AdminUserListQuery = {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
};
