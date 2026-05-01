import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { getUnreadCount } from "@/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "notification.view");
    const data = await getUnreadCount(authUser);
    return successResponse("Unread notification count fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
