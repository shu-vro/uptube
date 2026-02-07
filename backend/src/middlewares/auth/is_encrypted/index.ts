import { NextFunction, Request, Response } from "express";

export default function isEncrypted(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(req.headers, req.encrypted);
  if (req.headers["x-encrypt"] === "1" && req.encrypted) {
    next();
  } else {
    return req._error("Request must be encrypted", 400);
  }
}
