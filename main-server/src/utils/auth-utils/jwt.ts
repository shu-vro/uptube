import ENV from "config/env";
import jwt from "jsonwebtoken";
import aes from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

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
  // encrypt params
  const encrypted = aes
    .encrypt(JSON.stringify(params), ENV.JWT_ENCRYPTION_KEY)
    .toString();
  const token = jwt.sign(
    { data: encrypted },
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
    if (decoded && typeof decoded === "object" && "data" in decoded) {
      const decrypted = aes
        .decrypt(decoded.data, ENV.JWT_ENCRYPTION_KEY)
        .toString(Utf8);
      return JSON.parse(decrypted) as JwtPayload;
    }
    return null;
  } catch (error: any) {
    return null;
  }
}
