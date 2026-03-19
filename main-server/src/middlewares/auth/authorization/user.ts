import { NextFunction, Request, Response } from "express";
import { clearCookie, setCookie } from "utils/auth-utils/cookie-manager";
import { verifyToken } from "utils/auth-utils/jwt";
import { generateAccessToken } from "utils/auth-utils/token-generation";

async function setUserToRequest(userId: string) {
  const user = await global.global.prisma.user.findUnique({
    where: { id: userId },
  });
  return user;
}

export default async function authorizeUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return req._error("Unauthorized: No refresh token provided", 401);
  }

  const decodedRefresh = verifyToken(refreshToken);

  if (!decodedRefresh) {
    clearCookie(res, "refreshToken");
    clearCookie(res, "accessToken");
    return req._error("Unauthorized: Invalid refresh token", 401);
  }

  const accessToken = req.cookies.accessToken;
  // If access token is present and valid, proceed
  if (accessToken) {
    const accessTokenValid = verifyToken(accessToken);
    if (accessTokenValid) {
      const user = await setUserToRequest(accessTokenValid.id);
      req.user = user;
      return next();
    }
  }

  // Access token missing or invalid -> Attempt Refresh
  try {
    const dbRefreshToken = await global.prisma.refreshToken.findFirst({
      where: { userId: decodedRefresh.id },
    });

    if (!dbRefreshToken || dbRefreshToken.refreshToken !== refreshToken) {
      clearCookie(res, "refreshToken");
      clearCookie(res, "accessToken");
      return req._error("Unauthorized: Invalid refresh token", 401);
    }

    // Refresh valid -> Generate new Access Token
    const newAccessToken = generateAccessToken(decodedRefresh.id, "user");

    // Update latest access token in DB (optional security measure, can be relaxed for high concurrency)
    await global.prisma.refreshToken.update({
      where: { id: dbRefreshToken.id },
      data: { accessToken: newAccessToken },
    });

    setCookie(res, "accessToken", newAccessToken, {
      expires: new Date(Date.now() + 6 * 60 * 60 * 1000), // Match auth service (6h) or reduce to match token life
    });

    const user = await setUserToRequest(decodedRefresh.id);
    req.user = user;

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return req._error("Unauthorized: Server error during auth", 500);
  }
}
