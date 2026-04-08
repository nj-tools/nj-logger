import { bootstrapTelemetry } from "./telemetry.js";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  requestId?: string;
  userId?: string;
  source?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  meta?: Record<string, unknown>;
}

export type LogFormatter = (entry: LogEntry) => string;

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  fatal(message: string, meta?: Record<string, unknown>): void;
  child(context: LogContext): Logger;
}

export type Transport = (entry: LogEntry) => void | Promise<void>;

export interface TransportConfig {
  type: "console";
  level?: LogLevel;
}

export interface LoggerConfig {
  level?: LogLevel;
  json?: boolean;
  colorize?: boolean;
  defaultContext?: LogContext;
  transports?: TransportConfig[];
  formatter?: LogFormatter;
}

const LEVEL_ORDER: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];

function levelEnabled(minLevel: LogLevel, level: LogLevel): boolean {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(minLevel);
}

function createConsoleTransport(
  minLevel: LogLevel,
  json: boolean,
  colorize: boolean,
  formatter?: LogFormatter
): Transport {
  const colors: Record<LogLevel, string> = {
    debug: "\x1b[36m",
    info: "\x1b[32m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    fatal: "\x1b[35m",
  };
  const reset = "\x1b[0m";

  return (entry: LogEntry) => {
    if (!levelEnabled(minLevel, entry.level)) {
      return;
    }
    const time = entry.timestamp.toISOString();
    const base = {
      level: entry.level,
      time,
      msg: entry.message,
      ctx: entry.context,
      meta: entry.meta,
    };

    if (json) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(base));
      return;
    }

    if (formatter) {
      // eslint-disable-next-line no-console
      console.log(formatter(entry));
      return;
    }

    const color = colorize ? colors[entry.level] ?? "" : "";
    const prefix = color
      ? `${color}${entry.level.toUpperCase()}${reset}`
      : entry.level.toUpperCase();
    const ctxPart = entry.context?.source ? ` ${entry.context.source}` : "";
    // eslint-disable-next-line no-console
    console.log(
      `${time} ${prefix}${ctxPart}: ${entry.message}`,
      entry.meta ?? ""
    );
  };
}

class TsLogger implements Logger {
  private readonly transports: Transport[];
  private readonly minLevel: LogLevel;
  private readonly baseContext: LogContext;

  constructor(opts: {
    transports: Transport[];
    level: LogLevel;
    context?: LogContext;
  }) {
    this.transports = opts.transports;
    this.minLevel = opts.level;
    this.baseContext = opts.context ?? {};
  }

  private emit(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (!levelEnabled(this.minLevel, level)) return;
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.baseContext,
      meta,
    };
    for (const t of this.transports) {
      try {
        void t(entry);
      } catch {
        // ignore transport errors
      }
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.emit("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.emit("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.emit("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.emit("error", message, meta);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.emit("fatal", message, meta);
  }

  child(context: LogContext): Logger {
    return new TsLogger({
      transports: this.transports,
      level: this.minLevel,
      context: { ...this.baseContext, ...context },
    });
  }
}

let currentLogger: Logger | null = null;

export function initLogger(config: LoggerConfig = {}): Logger {
  if (currentLogger) {
    return currentLogger;
  }

  const minLevel: LogLevel = config.level ?? "info";
  const transports: Transport[] = [];

  const consoleCfg =
    config.transports?.find((t) => t.type === "console") ??
    ({ type: "console" } as TransportConfig);

  bootstrapTelemetry();

  transports.push(
    createConsoleTransport(
      consoleCfg.level ?? minLevel,
      config.json ?? true,
      config.colorize ?? true,
      config.formatter
    )
  );

  currentLogger = new TsLogger({
    transports,
    level: minLevel,
    context: config.defaultContext,
  });

  return currentLogger;
}

export function getLogger(): Logger {
  if (!currentLogger) {
    currentLogger = initLogger();
  }
  return currentLogger;
}

