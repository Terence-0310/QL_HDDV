import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "@/types/auth";
import { AppError } from "@/lib/errors";

const AUTH_TOKEN_EXPIRES_IN = "1d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT secret is not configured", 500, "JWT_SECRET_MISSING");
  }

  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: AUTH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401, "UNAUTHENTICATED");
  }
}

export function signResetPasswordToken(userId: string, passwordHash: string): string {
  const secret = getJwtSecret() + passwordHash;
  return jwt.sign({ id: userId }, secret, {
    expiresIn: "15m", // Link reset chỉ có hiệu lực 15 phút
  });
}

export function verifyResetPasswordToken(token: string, passwordHash: string): { id: string } {
  try {
    const secret = getJwtSecret() + passwordHash;
    return jwt.verify(token, secret) as { id: string };
  } catch {
    throw new AppError("Link khôi phục không hợp lệ hoặc đã hết hạn.", 400, "INVALID_TOKEN");
  }
}
