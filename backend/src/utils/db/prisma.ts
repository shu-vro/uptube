import logger from "config/logger/pino.logger";
import { PrismaClient } from "generated/prisma";

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => {
    logger.info("Connected to the database");
  })
  .catch((error) => {
    logger.error("Error connecting to the database:", error);
  });

export default prisma;
