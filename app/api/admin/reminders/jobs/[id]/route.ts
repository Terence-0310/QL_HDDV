import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { ReminderJobStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requirePermission(request, "admin.dashboard.view");
    const { id } = await context.params;
    const body = await request.json();

    const updateData: any = {};
    if (body.status && Object.values(ReminderJobStatus).includes(body.status)) {
      updateData.status = body.status;
      // If retrying, reset attempts and nextAttemptAt
      if (body.status === "PENDING") {
        updateData.attempts = 0;
        updateData.nextAttemptAt = new Date();
      }
    }

    const updatedJob = await prisma.reminderJob.update({
      where: { id },
      data: updateData,
    });

    return successResponse("Cập nhật trạng thái thành công", updatedJob);
  } catch (error) {
    return handleRouteError(error);
  }
}
