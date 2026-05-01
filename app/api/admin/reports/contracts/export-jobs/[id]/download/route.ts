import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-response";
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
    if (job.status !== "SUCCESS" || !job.csv) {
      throw new AppError("Export job is not ready", 409, "CONFLICT");
    }

    return new NextResponse(job.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${job.fileName ?? "contracts-report.csv"}"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
