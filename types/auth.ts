import type { UserRole, UserStatus } from "@prisma/client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  email: string;
};
