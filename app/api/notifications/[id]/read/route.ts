import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { markAsRead } from "@/services/notification.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "notifications:read", { limit: 120, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "notification.view");
    const { id } = await context.params;
    const data = await markAsRead(id, authUser);
    return successResponse("Notification marked as read", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
