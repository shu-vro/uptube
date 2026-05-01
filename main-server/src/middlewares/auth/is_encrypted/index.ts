import { NextFunction, Request, Response } from "express";

export default function isEncrypted(
  req: Request,
  _: Response,
  next: NextFunction
) {
  if (req.headers["x-encrypt"] === "1" && req.encrypted) {
    next();
  } else {
    return req._error("ACCESS RESTRICTED", 400);
  }
}
