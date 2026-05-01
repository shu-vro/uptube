import { NextFunction, Request, Response } from "express";
import ApiError from "../../utils/error/ApiError";

const globalErrorHandler = (
  err: ApiError,
  _: Request,
  res: Response,
  __: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

export default globalErrorHandler;
