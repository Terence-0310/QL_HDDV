import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { AppError } from "@/lib/errors";

const CRON_HEADER = "x-cron-secret";
const CRON_TIMESTAMP_HEADER = "x-cron-timestamp";
const CRON_SIGNATURE_HEADER = "x-cron-signature";

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isValidCronRequest(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return false;
  }

  const signedTimestamp = request.headers.get(CRON_TIMESTAMP_HEADER);
  const signedSignature = request.headers.get(CRON_SIGNATURE_HEADER);
  if (signedTimestamp && signedSignature) {
    const timestampMs = Number(signedTimestamp);
    if (!Number.isFinite(timestampMs)) return false;
    if (Math.abs(Date.now() - timestampMs) > 5 * 60_000) return false;

    const expected = crypto.createHmac("sha256", configuredSecret).update(signedTimestamp).digest("hex");
    return safeEqual(signedSignature, expected);
  }

  const requestSecret = request.headers.get(CRON_HEADER);
  if (!requestSecret) return false;
  return safeEqual(requestSecret, configuredSecret);
}

export function requireCronSecret(request: NextRequest) {
  if (!isValidCronRequest(request)) {
    throw new AppError("Invalid cron secret", 403, "FORBIDDEN");
  }
}
