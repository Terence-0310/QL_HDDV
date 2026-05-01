import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signAuthToken } from "@/lib/jwt";
import { AppError } from "@/lib/errors";
import type { AuthUser } from "@/types/auth";
import { createAuditLog } from "@/services/audit.service";
import type { RegisterInput } from "@/lib/validators/auth.validator";

export type LoginResult = {
  user: AuthUser;
  token: string;
};

export type RegisterResult = {
  user: AuthUser;
  token: string;
};

function toAuthUser(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}): AuthUser {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    status: input.status,
  };
}

export async function registerWithCredentials(input: RegisterInput): Promise<RegisterResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("Email đã tồn tại", 409, "EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);
  const created = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  await createAuditLog({
    userId: created.id,
    action: "AUTH_REGISTER_SUCCESS",
    entityType: "USER",
    entityId: created.id,
    metadata: { email: created.email },
  });

  const authUser = toAuthUser(created);
  return {
    user: authUser,
    token: signAuthToken({
      sub: created.id,
      role: created.role,
      email: created.email,
    }),
  };
}

export async function loginWithCredentials(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await createAuditLog({
      action: "AUTH_LOGIN_FAILED",
      entityType: "USER",
      entityId: user?.id ?? "unknown",
      metadata: { email },
    });
    throw new AppError("Email hoặc mật khẩu không đúng", 401, "INVALID_CREDENTIALS");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError("Tài khoản đã bị khóa", 403, "ACCOUNT_BLOCKED");
  }

  if (user.status === UserStatus.INACTIVE) {
    throw new AppError("Tài khoản chưa được kích hoạt", 403, "ACCOUNT_INACTIVE");
  }

  const authUser = toAuthUser(user);

  await createAuditLog({
    userId: user.id,
    action: "AUTH_LOGIN_SUCCESS",
    entityType: "USER",
    entityId: user.id,
    metadata: { email: user.email },
  });

  return {
    user: authUser,
    token: signAuthToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    }),
  };
}
