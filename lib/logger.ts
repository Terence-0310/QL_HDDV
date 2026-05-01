type LogLevel = "info" | "warn" | "error";

function formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata ? { metadata } : {}),
  });
}

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  const output = formatLog(level, message, metadata);
  if (level === "error") {
    console.error(output);
    return;
  }
  if (level === "warn") {
    console.warn(output);
    return;
  }
  console.log(output);
}

export const logger = {
  info: (message: string, metadata?: Record<string, unknown>) => write("info", message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => write("warn", message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => write("error", message, metadata),
};
