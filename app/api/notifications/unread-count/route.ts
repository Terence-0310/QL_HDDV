import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { getUnreadCount } from "@/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "notification.view");
    const data = await getUnreadCount(authUser);
    const response = successResponse("Unread notification count fetched successfully", data);
    response.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=15");
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
