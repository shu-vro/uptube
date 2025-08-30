import ENV from "config/env";
import jwt from "jsonwebtoken";

export function signToken(params: { [key: string]: any }) {
  const token = jwt.sign(params, ENV.JWT_SECRET, {
    expiresIn: "1w",
  });
  return token;
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    return decoded;
  } catch (error: any) {
    return null;
  }
}
