import { CookieOptions, Response } from "express";

export function setCookie(
  res: Response,
  name: string,
  value: string,
  options?: CookieOptions
) {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    ...options,
  };
  res.cookie(name, value, cookieOptions);
}
