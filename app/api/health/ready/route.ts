import { ReminderJobStatus } from "@prisma/client";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [dbCheck, pendingJobs] = await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      prisma.reminderJob.count({
        where: { status: { in: [ReminderJobStatus.PENDING, ReminderJobStatus.FAILED] } },
      }),
    ]);

    return successResponse("ready", {
      ready: Boolean(dbCheck),
      pendingReminderJobs: pendingJobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
