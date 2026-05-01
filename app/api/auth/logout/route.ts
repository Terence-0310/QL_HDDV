import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { assertCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "auth:logout", { limit: 30, windowMs: 60_000 });
    assertCsrf(request);
    const response = successResponse("Đăng xuất thành công", { loggedOut: true });
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: "",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
