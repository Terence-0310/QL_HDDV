import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { ReminderJobStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [pending, failed, deadLetter, dbCheck] = await Promise.all([
      prisma.reminderJob.count({ where: { status: ReminderJobStatus.PENDING } }),
      prisma.reminderJob.count({ where: { status: ReminderJobStatus.FAILED } }),
      prisma.reminderJob.count({ where: { status: ReminderJobStatus.DEAD_LETTER } }),
      prisma.$queryRaw`SELECT 1`.catch(() => null),
    ]);

    const isDbHealthy = dbCheck !== null;
    const isQueueHealthy = deadLetter === 0;
    const status = isDbHealthy && isQueueHealthy ? "healthy" : "degraded";

    return successResponse("ok", {
      service: "contract-management-system",
      status,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      dependencies: {
        database: isDbHealthy ? "up" : "down",
      },
      queue: {
        pending,
        failed,
        deadLetter,
        healthy: isQueueHealthy,
      },
    }, undefined, status === "healthy" ? 200 : 503);
  } catch (error) {
    return errorResponse("Health check failed", 500, "HEALTH_CHECK_FAILED");
  }
}
