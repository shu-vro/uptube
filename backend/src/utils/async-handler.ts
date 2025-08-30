import logger from "config/logger/pino.logger";
import { Request, Response, NextFunction } from "express";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => {
      logger.error(err);
      if (process.env.NODE_ENV === "development") {
        req._error(err.message || "Internal Server Error", 500);
      } else {
        req._error("Internal Server Error", 500);
      }
    });
  };
