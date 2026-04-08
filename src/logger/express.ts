import type { Request, Response, NextFunction } from "express";
import { getLogger } from "./core.js";

export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const base = getLogger();
    const headerId = req.headers["x-request-id"];
    const fromHeader =
      typeof headerId === "string" ? headerId : Array.isArray(headerId) ? headerId[0] : undefined;

    const requestId =
      fromHeader ??
      (globalThis.crypto?.randomUUID?.() ??
        Math.random().toString(36).slice(2));

    const logger = base.child({
      requestId,
      method: req.method,
      path: req.path,
    });

    (req as any).logger = logger;

    logger.info("HTTP request started");
    res.on("finish", () => {
      logger.info("HTTP request finished", { status: res.statusCode });
    });

    next();
  };
}

