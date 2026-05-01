import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { approvalQueueQuerySchema } from "@/lib/validators/approval.validator";
import { listPendingApprovals } from "@/services/admin.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "contract.approve");
    const parsed = approvalQueueQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const data = await listPendingApprovals(parsed);
    return successResponse("Pending approvals fetched successfully", data.items, {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.total,
      totalPages: data.totalPages,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
