import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { getDashboardCharts } from "@/services/dashboard.service";
import { parseQueryDate } from "@/lib/date";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    
    const from = fromStr ? parseQueryDate(fromStr) : undefined;
    const to = toStr ? parseQueryDate(toStr) : undefined;

    const data = await getDashboardCharts(authUser, from, to);
    const response = successResponse("Dashboard charts fetched successfully", data);
    response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
