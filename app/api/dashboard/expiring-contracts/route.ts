import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { getDashboardExpiringContracts } from "@/services/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const data = await getDashboardExpiringContracts(authUser, days, limit);
    return successResponse("Expiring contracts fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
