import { logger } from "@/lib/logger";
import { processPendingReminderJobs } from "@/services/reminder/reminder-worker.service";

const intervalMs = Number(process.env.REMINDER_WORKER_INTERVAL_MS ?? "30000");

async function runCycle() {
  const startedAt = new Date();
  const summary = await processPendingReminderJobs();
  logger.info("reminder.worker.cycle", {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    ...summary,
  });
}

async function start() {
  logger.info("reminder.worker.daemon.start", { intervalMs });
  await runCycle();
  setInterval(() => {
    void runCycle().catch((error) => {
      logger.error("reminder.worker.daemon.error", {
        message: error instanceof Error ? error.message : "Unknown worker error",
      });
    });
  }, intervalMs);
}

void start();
