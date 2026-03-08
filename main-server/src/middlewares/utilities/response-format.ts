import { NextFunction, Request, Response } from "express";

const responseFormat = (req: Request, res: Response, next: NextFunction) => {
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
