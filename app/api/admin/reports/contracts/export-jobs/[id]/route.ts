import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { getContractsExportJob } from "@/services/report-export-job.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requirePermission(request, "report.export");
    const { id } = await context.params;
    const job = getContractsExportJob(id);
    if (!job) {
      throw new AppError("Export job not found", 404, "NOT_FOUND");
    }

    return successResponse("Export job fetched", {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
      fileName: job.fileName,
      error: job.error,
      downloadUrl: job.status === "SUCCESS" ? `/api/admin/reports/contracts/export-jobs/${job.id}/download` : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
