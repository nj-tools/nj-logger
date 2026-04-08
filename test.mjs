import { initLogger, getLogger } from "./dist/index.js";
initLogger({ level: "debug" });
const log = getLogger("test");
log.info("hello from test");
log.warn("warning test", { extra: 123 });
log.error("error test");