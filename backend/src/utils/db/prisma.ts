import logger from "config/logger/pino.logger";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

prisma
  .$connect()
  .then(() => {
    logger.info("Connected to the database");
  })
  .catch((error) => {
    logger.error("Error connecting to the database:", error);
  });

export default prisma;
