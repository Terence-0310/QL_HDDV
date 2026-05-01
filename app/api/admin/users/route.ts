import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { adminUserListQuerySchema, adminCreateUserSchema } from "@/lib/validators/admin.validator";
import { listUsers, createUser } from "@/services/admin.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertCsrf } from "@/lib/csrf";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "user.view");
    const parsed = adminUserListQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      role: request.nextUrl.searchParams.get("role") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
    });

    const data = await listUsers(parsed);
    return successResponse("Users fetched successfully", data.items, {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.total,
      totalPages: data.totalPages,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "admin:users:create", { limit: 10, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "user.manage");
    const body = await request.json();
    const parsed = adminCreateUserSchema.parse(body);
    const data = await createUser(parsed, authUser);
    return successResponse("User created successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
