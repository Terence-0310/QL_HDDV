import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { getDashboardRecentActivities } from "@/services/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    const data = await getDashboardRecentActivities(authUser, limit);
    const response = successResponse("Recent activities fetched successfully", data);
    response.headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
