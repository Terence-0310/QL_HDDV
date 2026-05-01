import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function getClientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export function assertRateLimit(
  request: NextRequest,
  scope: string,
  options?: { limit?: number; windowMs?: number },
) {
  const limit = options?.limit ?? 60;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();
  const key = `${scope}:${getClientKey(request)}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= limit) {
    throw new AppError("Too many requests", 429, "RATE_LIMITED");
  }

  entry.count += 1;
  store.set(key, entry);
}
