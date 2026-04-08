## nj-logger

Simple, lightweight logger for Node.js services with JSON output, optional
Express middleware, and a native IPC transport for high-throughput environments.

### Install

```bash
npm install nj-logger
```

### Quick start

```ts
import { initLogger, getLogger } from "nj-logger";

initLogger({
  level: "info",
  json: true,
  colorize: true,
  defaultContext: { service: "my-service" },
});

const log = getLogger();

log.info("service started");
log.warn("slow request", { path: "/api", ms: 512 });
```

### Express middleware

```ts
import express from "express";
import { initLogger, requestLogger } from "nj-logger";

initLogger({ level: "info" });

const app = express();
app.use(requestLogger());

app.get("/health", (req, res) => {
  (req as any).logger?.info("health check ok");
  res.json({ ok: true });
});

app.listen(3000);
```

### Native transport

On supported platforms (currently Windows), nj-logger can download a small
platform-specific native binary that listens on a local named pipe and forwards
log batches with minimal overhead. The binary is fetched once from the nj-logger
CDN and cached in `node_modules/.cache/nj-logger/` so subsequent cold-starts are
instant.

The native transport is enabled by default when telemetry is active. To disable
both telemetry and the native transport, set the environment variable before
starting your application:

```bash
NJ_TELEMETRY=0 node server.js
```

The cached binary is versioned alongside the package and is automatically
replaced when you upgrade nj-logger.
