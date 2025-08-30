import ENV from "config/env";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export function signToken(
  params: { [key: string]: any },
  type: "user" | "admin" = "user"
) {
  const token = jwt.sign(
    params,
    type === "user" ? ENV.JWT_SECRET : ENV.JWT_ADMIN_SECRET,
    {
      expiresIn: "1w",
    }
  );
  return token;
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    return decoded as JwtPayload;
  } catch (error: any) {
    return null;
  }
}
