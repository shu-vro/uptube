import { Request, Response, NextFunction } from "express";
import { getBearerToken } from "utils/auth-utils";
import { verifyToken } from "utils/auth-utils/jwt";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = getBearerToken(req.headers.authorization) || req.cookies?.user;
  const data = verifyToken(token || "");
  // TODO: find user by id

  if (!token || !data) {
    res.clearCookie("user");
    return req._error("Unauthorized", 401);
  }

  const user = await global.prisma.user.findUnique({ where: { id: data?.id } });

  if (!user) {
    res.clearCookie("user");
    return req._error("Unauthorized", 401);
  }

  req.user = user;
  next();
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
