import path from "path";
import pino from "pino";
import pinoCaller from "pino-caller";

const projectRoot = path.resolve(__dirname, "../../../"); // Adjust as needed

const logger = pinoCaller(
    pino({
        level: process.env.LOG_LEVEL || "info",
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
