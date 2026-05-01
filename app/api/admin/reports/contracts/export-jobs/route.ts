import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { reportContractsQuerySchema } from "@/lib/validators/report.validator";
import { createContractsExportJob } from "@/services/report-export-job.service";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "reports:export-jobs", { limit: 10, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "report.export");
    const parsed = reportContractsQuerySchema.parse({
      page: 1,
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

    const job = await createContractsExportJob(parsed, authUser);
    return successResponse("Export job created", { id: job.id, status: job.status }, undefined, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
