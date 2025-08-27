import { createServer } from "http";
import app from "./app";
import logger from "./config/logger/pino.logger";

const server = createServer(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

const shutdown = () => {
  logger.info("Gracefully shutting down...");
  server.close((err) => {
    if (err) {
      logger.error(
        `Error during server shutdown: ${
          err instanceof Error ? err.stack || err.message : err
        }`
      );
      process.exit(1);
    }
    logger.info("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
