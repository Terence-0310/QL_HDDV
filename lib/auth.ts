import type { NextRequest } from "next/server";
import { UserStatus, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";
import { AppError } from "@/lib/errors";
import type { AuthUser } from "@/types/auth";

export const AUTH_COOKIE_NAME = "hms_auth_session";

function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) {
    return token;
  }

  return null;
}

export async function getAuthUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    return null;
  }

  if (user.status !== UserStatus.ACTIVE) {
    return null;
  }

  return user;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }

  return user;
}

export async function requireRole(request: NextRequest, roles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new AppError("Insufficient permissions", 403, "FORBIDDEN");
  }

  return user;
}
