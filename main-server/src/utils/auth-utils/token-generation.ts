import { Response } from "express";
import { setCookie } from "utils/auth-utils/cookie-manager";
import { signToken } from "utils/auth-utils/jwt";

export type GenerateTokensParams = {
  userId: string;
  res?: Response;
  type?: Parameters<typeof signToken>[1];
};

export function generateAccessToken(
  userId: string,
  type: GenerateTokensParams["type"]
) {
  const todayDateUtc = new Date();
  const expDateUtc = new Date(todayDateUtc);
  expDateUtc.setMinutes(todayDateUtc.getMinutes() + 15); // 15 minutes expiration

  return signToken(
    {
      id: userId,
      iat: Math.floor(todayDateUtc.getTime() / 1000),
      exp: Math.floor(expDateUtc.getTime() / 1000),
    },
    type
  );
}

export function generateRefreshToken(
  userId: string,
  accessToken: string,
  type: GenerateTokensParams["type"]
) {
  const todayDateUtc = new Date();
  const expDateUtc = new Date(todayDateUtc);
  expDateUtc.setDate(todayDateUtc.getDate() + 30); // 30 days expiration

  return signToken(
    {
      id: userId,
      accessToken,
      iat: Math.floor(todayDateUtc.getTime() / 1000),
      exp: Math.floor(expDateUtc.getTime() / 1000),
    },
    type
  );
}

export function generateAccessAndRefreshTokens({
  userId,
  type = "user",
  res,
}: GenerateTokensParams) {
  const accessToken = generateAccessToken(userId, type);

  const refreshToken = generateRefreshToken(userId, accessToken, type);

  if (res) {
    setCookie(res, "refreshToken", refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    setCookie(res, "accessToken", accessToken, {
      maxAge: 6 * 60 * 60 * 1000, // 6 hours
    });
  }

  return { accessToken, refreshToken };
}
