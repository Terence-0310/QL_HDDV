import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

export const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function assertCsrf(request: NextRequest) {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new AppError("Invalid CSRF token", 403, "FORBIDDEN");
  }
}
