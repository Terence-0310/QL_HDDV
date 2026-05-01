import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { adminUserListQuerySchema } from "@/lib/validators/admin.validator";
import { listUsers } from "@/services/admin.service";

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
