import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { reminderPreviewQuerySchema } from "@/lib/validators/reminder.validator";
import { getReminderCandidates } from "@/services/reminder.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "reminder.run");
    const parsed = reminderPreviewQuerySchema.parse({
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    const data = await getReminderCandidates({ limit: parsed.limit });
    return successResponse("Reminder candidates preview fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
