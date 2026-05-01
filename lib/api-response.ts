import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export function successResponse<T>(message: string, data?: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, message, data, meta }, { status });
}

export function errorResponse(message: string, status = 500, code?: string, details?: unknown) {
  return NextResponse.json(
    { success: false, message, code, details },
    { status },
  );
}

function mapZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
    return errorResponse("Validation failed", 400, "VALIDATION_ERROR", mapZodError(error as ZodError));
  }

  return errorResponse("Unexpected server error", 500, "INTERNAL_ERROR");
}
