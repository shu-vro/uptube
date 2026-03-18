import { Response } from "express";
import { RefreshToken } from "generated/prisma/client";
import { passwordCompare } from "utils/auth-utils";
import { setCookie } from "utils/auth-utils/cookie-manager";
import { verifyToken } from "utils/auth-utils/jwt";
import {
  generateAccessAndRefreshTokens,
  GenerateTokensParams,
} from "utils/auth-utils/token-generation";

export async function validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (!user) {
    return null;
  }

  const isPasswordValid = passwordCompare(password, user.password);

  if (!isPasswordValid) {
    return null;
  }
  return user;
}

export async function generateAndUpdateTokens({
  userId,
  res,
  type,
  existingRefreshToken,
}: GenerateTokensParams & {
  existingRefreshToken: RefreshToken | null;
}) {
  // generate and update refresh token
  const { accessToken, refreshToken } = generateAccessAndRefreshTokens({
    userId,
    type,
    res,
  });

  if (existingRefreshToken) {
    await global.prisma.refreshToken.update({
      where: { id: existingRefreshToken.id },
      data: { refreshToken, accessToken },
    });
  } else {
    // Upsert or create new token linked to user
    // Since userId is unique on RefreshToken, we can use upsert to be safe or create
    await global.prisma.refreshToken.upsert({
      where: { userId },
      update: { refreshToken, accessToken },
      create: {
        refreshToken,
        accessToken,
        userId,
      },
    });
  }
}

export async function authorizeUserOnLogin(userId: string, res: Response) {
  // find refresh token for user
  const existingRefreshToken = await global.prisma.refreshToken.findUnique({
    where: { userId },
  });

  const existingRefreshTokenValue = existingRefreshToken?.refreshToken;

  if (verifyToken(existingRefreshTokenValue || "") !== null) {
    // check access token validity
    const accessTokenValid = verifyToken(
      existingRefreshToken?.accessToken || ""
    );

    if (accessTokenValid) {
      setCookie(res, "refreshToken", existingRefreshTokenValue || "", {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      setCookie(res, "accessToken", existingRefreshToken?.accessToken || "", {
        maxAge: 6 * 60 * 60 * 1000, // 6 hours
      });

      return true;
    } else {
      // generate and update access and refresh token;
      await generateAndUpdateTokens({
        userId,
        res,
        type: "user",
        existingRefreshToken: existingRefreshToken,
      });
    }
    return true;
  } else {
    await generateAndUpdateTokens({
      userId,
      res,
      type: "user",
      existingRefreshToken: existingRefreshToken,
    });
    return true;
  }
}
