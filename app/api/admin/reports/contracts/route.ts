import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { reportContractsQuerySchema } from "@/lib/validators/report.validator";
import { getContractsReport } from "@/services/report.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "report.view");
    const parsed = reportContractsQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      approvalStatus: request.nextUrl.searchParams.get("approvalStatus") ?? undefined,
      ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
      startDateFrom: request.nextUrl.searchParams.get("startDateFrom") ?? undefined,
      startDateTo: request.nextUrl.searchParams.get("startDateTo") ?? undefined,
      endDateFrom: request.nextUrl.searchParams.get("endDateFrom") ?? undefined,
      endDateTo: request.nextUrl.searchParams.get("endDateTo") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
    });

    const data = await getContractsReport(parsed);
    return successResponse("Contracts report fetched successfully", data.items, {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.total,
      totalPages: data.totalPages,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
