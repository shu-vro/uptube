import { Request, Response, NextFunction } from "express";
import { getBearerToken } from "utils/auth-utils";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = req.cookies;
  const token = getBearerToken(cookies);
  if (!token) {
    return req._error("Unauthorized", 401);
  }
  next();
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
