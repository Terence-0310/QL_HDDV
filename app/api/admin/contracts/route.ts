import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { adminContractsQuerySchema } from "@/lib/validators/admin.validator";
import { listAdminContracts } from "@/services/admin.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "admin.dashboard.view");
    const parsed = adminContractsQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
    });
    const data = await listAdminContracts(parsed);
    return successResponse("Admin contracts fetched successfully", data.items, {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.total,
      totalPages: data.totalPages,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
