import ENV from "config/env";
import FLAGS from "config/FLAGS";
import path from "path";
import pino from "pino";
import pinoCaller from "pino-caller";

const projectRoot = path.resolve(__dirname, "../../../"); // Adjust as needed

const logger = pinoCaller(
  pino({
    level: ENV.LOG_LEVEL || "info",
    enabled: !FLAGS.STOP_PINO_AT_PROD,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  }),
  {
    relativeTo: projectRoot,
  }
);

export default logger;
