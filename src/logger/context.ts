import type { Logger, LogContext } from "./core.js";

export function withRequestId(logger: Logger, requestId: string): Logger {
  return logger.child({ requestId });
}

export function withUser(logger: Logger, userId: string): Logger {
  return logger.child({ userId });
}

export function withContext(logger: Logger, ctx: LogContext): Logger {
  return logger.child(ctx);
}

