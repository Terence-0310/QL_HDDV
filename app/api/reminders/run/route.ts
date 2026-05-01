import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { isValidCronRequest } from "@/lib/cron-auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { reminderRunBodySchema } from "@/lib/validators/reminder.validator";
import { processReminderCandidates } from "@/services/reminder.service";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "reminders:run", { limit: 20, windowMs: 60_000 });
    const cronAuthorized = isValidCronRequest(request);
    let triggeredByUserId: string | undefined;
    let triggerSource: "admin" | "cron" = "cron";

    if (!cronAuthorized) {
      assertCsrf(request);
      const authUser = await requirePermission(request, "reminder.run");
      triggeredByUserId = authUser.id;
      triggerSource = "admin";
    }

    const body = await request.json().catch(() => ({}));
    const parsed = reminderRunBodySchema.parse(body);
    const data = await processReminderCandidates({
      limit: parsed.limit,
      triggeredByUserId,
      triggerSource,
    });

    return successResponse("Reminder job executed", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
