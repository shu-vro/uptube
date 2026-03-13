import FLAGS from "config/FLAGS";
import logger from "config/logger/pino.logger";
import { NextFunction, Request, Response } from "express";
import { encryptHybrid } from "utils/encryption";

const responseFormat = (req: Request, res: Response, next: NextFunction) => {
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

  req._success = async (json: any, status?: number) => {
    let output = json;
    if (FLAGS.ENCRYPTED_RESPONSES_ONLY) {
      output = await encryptHybrid(
        JSON.stringify(json),
        req.client_public_key || ""
      );
    }
    req.requestSent = true;
    res.status(status || 200).json({
      success: true,
      statusCode: status || 200,
      data: output,
    });
  };
  req._error = (message: any, status?: number) => {
    req.requestSent = true;
    res.status(status || 400).json({
      success: false,
      statusCode: status || 400,
      error: message,
    });
  };
  next();
};

export default responseFormat;
