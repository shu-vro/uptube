import ENV from "config/env";
import logger from "config/logger/pino.logger";
import { Request, Response, NextFunction } from "express";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => {
      if (ENV.NODE_ENV === "development") {
        console.error(err);
        req._error(err.message || "Internal Server Error", 500);
      } else {
        logger.error(err?.message || err);
        req._error("Internal Server Error", 500);
      }
    });
  };
