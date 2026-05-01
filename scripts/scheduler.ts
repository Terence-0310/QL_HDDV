import cron from "node-cron";
import { logger } from "@/lib/logger";
import { processReminderCandidates } from "@/services/reminder.service";

// Default is 00:00 every day
const cronExpression = process.env.REMINDER_CRON_EXPRESSION ?? "0 0 * * *";

logger.info("scheduler.start", { cronExpression });

cron.schedule(cronExpression, async () => {
  logger.info("scheduler.run.start", { time: new Date().toISOString() });
  try {
    const summary = await processReminderCandidates({ triggerSource: "cron" });
    logger.info("scheduler.run.success", summary);
  } catch (error) {
    logger.error("scheduler.run.error", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Optionally, keep the process alive and listen to termination signals
process.on("SIGINT", () => {
  logger.info("scheduler.stop", { signal: "SIGINT" });
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("scheduler.stop", { signal: "SIGTERM" });
  process.exit(0);
});
