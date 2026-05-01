import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { getAdminSummaryReport } from "@/services/report.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "report.view");
    const data = await getAdminSummaryReport(authUser);
    return successResponse("Admin report summary fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
