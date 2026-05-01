import { logger } from "@/lib/logger";
import { processPendingReminderJobs } from "@/services/reminder/reminder-worker.service";

async function main() {
  const startedAt = new Date();
  logger.info("reminder.worker.start", { startedAt: startedAt.toISOString() });

  const summary = await processPendingReminderJobs();

  logger.info("reminder.worker.finish", {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    ...summary,
  });
}

main()
  .catch((error) => {
    logger.error("reminder.worker.error", {
      message: error instanceof Error ? error.message : "Unknown worker error",
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    // Keep script behavior explicit for one-shot runs.
    await Promise.resolve();
  });
