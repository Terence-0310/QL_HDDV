import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { reportContractsQuerySchema } from "@/lib/validators/report.validator";
import { exportContractsReportCsv } from "@/services/report.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "report.export");
    const parsed = reportContractsQuerySchema.parse({
      page: 1,
      // Keep pageSize within validator limits to avoid 400 validation errors on export.
      pageSize: 200,
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

    const csv = await exportContractsReportCsv(parsed, authUser);
    const dateSuffix = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="contracts-report-${dateSuffix}.csv"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
