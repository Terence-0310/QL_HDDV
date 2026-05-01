import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { createCsrfToken, CSRF_COOKIE_NAME } from "@/lib/csrf";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const response = successResponse("Lấy thông tin người dùng thành công", user);
    if (!request.cookies.get(CSRF_COOKIE_NAME)?.value) {
      response.cookies.set({
        name: CSRF_COOKIE_NAME,
        value: createCsrfToken(),
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
