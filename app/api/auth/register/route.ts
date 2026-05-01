import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { createCsrfToken, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators/auth.validator";
import { registerWithCredentials } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "auth:register", { limit: 10, windowMs: 60_000 });
    const body = await request.json();
    const parsed = registerSchema.parse(body);
    const result = await registerWithCredentials(parsed);

    const response = successResponse("Đăng ký thành công", result.user, undefined, 201);
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: createCsrfToken(),
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
