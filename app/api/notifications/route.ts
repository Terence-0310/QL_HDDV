import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { notificationListQuerySchema } from "@/lib/validators/notification.validator";
import { listNotifications } from "@/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "notification.view");
    const parsed = notificationListQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      isRead: request.nextUrl.searchParams.get("isRead") ?? undefined,
    });

    const data = await listNotifications(parsed, authUser);
    const response = successResponse("Notifications fetched successfully", data.items, {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.total,
      totalPages: data.totalPages,
    });
    response.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
