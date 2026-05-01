import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { getContractStats } from "@/services/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "contract.view");
    const data = await getContractStats(authUser);
    return successResponse("Dashboard stats fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
