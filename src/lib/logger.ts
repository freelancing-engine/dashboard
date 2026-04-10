type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  logger: string;
  message: string;
  [key: string]: unknown;
}

function emit(
  level: LogLevel,
  logger: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    logger,
    message,
    ...extra,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function getLogger(name: string) {
  return {
    info: (message: string, extra?: Record<string, unknown>) =>
      emit("info", name, message, extra),
    warn: (message: string, extra?: Record<string, unknown>) =>
      emit("warn", name, message, extra),
    error: (message: string, extra?: Record<string, unknown>) =>
      emit("error", name, message, extra),
  };
}
