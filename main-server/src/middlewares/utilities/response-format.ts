import { NextFunction, Request, Response } from "express";

const responseFormat = (req: Request, res: Response, next: NextFunction) => {
  req.platform =
    req.header("x-platform")?.trim().substring(0, 100) || "unknown";
  req.appVersion =
    req.header("x-app-version")?.trim().substring(0, 100) || "unknown";
  req.platformVersion =
    req.header("x-platform-version")?.trim().substring(0, 100) || "unknown";
  req.buildVersion =
    req.header("x-build-version")?.trim().substring(0, 100) || "unknown";

  req._success = (json: any, status?: number) => {
    req.requestSent = true;
    res.status(status || 200).json({
      success: true,
      statusCode: status || 200,
      data: json,
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
