import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { markAllAsRead } from "@/services/notification.service";

export async function PATCH(request: NextRequest) {
  try {
    assertRateLimit(request, "notifications:read-all", { limit: 30, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "notification.view");
    const data = await markAllAsRead(authUser);
    return successResponse("All notifications marked as read", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
