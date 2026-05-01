const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_BASE_MS = 30_000;
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_WORKER_CONCURRENCY = 3;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function getReminderQueueConfig() {
  return {
    maxAttempts: parsePositiveInt(process.env.REMINDER_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS),
    backoffBaseMs: parsePositiveInt(process.env.REMINDER_RETRY_BASE_MS, DEFAULT_BACKOFF_BASE_MS),
    workerBatchSize: parsePositiveInt(process.env.REMINDER_WORKER_BATCH_SIZE, DEFAULT_BATCH_SIZE),
    workerConcurrency: parsePositiveInt(process.env.REMINDER_WORKER_CONCURRENCY, DEFAULT_WORKER_CONCURRENCY),
    verboseWorkerLogs: process.env.REMINDER_VERBOSE_LOGS === "true",
  };
}

export function computeBackoffDelay(attempts: number, baseMs: number): number {
  const safeAttempts = Math.max(attempts, 1);
  return baseMs * 2 ** (safeAttempts - 1);
}
