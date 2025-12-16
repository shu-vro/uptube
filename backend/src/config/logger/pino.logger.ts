import ENV from "config/env";
import FLAGS from "config/FLAGS";
import path from "path";
import pino from "pino";
import pinoCaller from "pino-caller";
import pretty from "pino-pretty";

const projectRoot = path.resolve(__dirname, "../../../");

const stream = pretty({
  levelFirst: true,
  colorize: true,
  translateTime: "SYS:standard",
});

const logger = pinoCaller(
  pino(
    {
      level: ENV.LOG_LEVEL || "info",
      enabled: !FLAGS.STOP_PINO_AT_PROD,
      timestamp: pino.stdTimeFunctions.isoTime,
      base: null,
    },
    stream
  ),
  {
    relativeTo: projectRoot,
  }
);

export default logger;
