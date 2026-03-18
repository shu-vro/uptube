import FLAGS from "config/FLAGS";
import logger from "config/logger/pino.logger";
import { NextFunction, Request, Response } from "express";
import { encryptHybrid } from "utils/encryption";

const setReqVariables = (req: Request, res: Response, next: NextFunction) => {
  req.platform =
    req.header("x-platform")?.trim().substring(0, 100) || "unknown";
  req.appVersion =
    req.header("x-app-version")?.trim().substring(0, 100) || "unknown";
  req.platformVersion =
    req.header("x-platform-version")?.trim().substring(0, 100) || "unknown";
  req.buildVersion =
    req.header("x-build-version")?.trim().substring(0, 100) || "unknown";
  req.client_public_key =
    req.query.client_public_key || req.body.client_public_key || "";
  next();
};

export default setReqVariables;
