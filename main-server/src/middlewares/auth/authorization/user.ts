import logger from "config/logger/pino.logger";
import { NextFunction, Request, Response } from "express";
import { clearCookie, setCookie } from "utils/auth-utils/cookie-manager";
import { verifyToken } from "utils/auth-utils/jwt";
import { generateAccessToken } from "utils/auth-utils/token-generation";

function normalizeCookieTokens(
  refreshTokenRaw?: string,
  accessTokenRaw?: string,
) {
  let refreshToken = refreshTokenRaw?.trim();
  let accessToken = accessTokenRaw?.trim();

  // Some clients incorrectly send:
  // refreshToken="<jwt>,accessToken=<jwt>"
  if (refreshToken?.includes(",accessToken=")) {
    const [rawRefresh, rawAccess] = refreshToken.split(",accessToken=");
    refreshToken = rawRefresh?.trim();
    if (!accessToken && rawAccess) {
      accessToken = rawAccess.trim();
    }
  }

  return { refreshToken, accessToken };
}

async function setUserToRequest(userId: string) {
  const user = await global.global.prisma.user.findUnique({
    where: { id: userId },
  });
  return user;
}

export default async function authorizeUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const normalized = normalizeCookieTokens(
    req.cookies.refreshToken,
    req.cookies.accessToken,
  );
  const refreshToken = normalized.refreshToken;
  let accessToken = normalized.accessToken;

  if (
    refreshToken !== req.cookies.refreshToken ||
    accessToken !== req.cookies.accessToken
  ) {
    logger.warn("Recovered malformed auth cookies from client");
    if (refreshToken) {
      setCookie(res, "refreshToken", refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    if (accessToken) {
      setCookie(res, "accessToken", accessToken, {
        maxAge: 6 * 60 * 60 * 1000,
      });
    }
  }

  if (!refreshToken) {
    logger.warn("Authorization failed: No refresh token provided");
    return req._error("Unauthorized: No refresh token provided", 401);
  }

  const decodedRefresh = verifyToken(refreshToken);

  if (!decodedRefresh) {
    logger.warn("Authorization failed(decodedRefresh): Invalid refresh token");
    clearCookie(res, "refreshToken");
    clearCookie(res, "accessToken");
    return req._error("Unauthorized: Invalid refresh token", 401);
  }

  // If access token is present and valid, proceed
  if (accessToken) {
    const accessTokenValid = verifyToken(accessToken);
    if (accessTokenValid) {
      const user = await setUserToRequest(accessTokenValid.id);
      req.user = user;
      logger.info(`User authorized via access token: ${user?.id}`);
      return next();
    } else {
      logger.debug("Access token invalid, attempting refresh");
    }
  } else {
    logger.debug("Access token missing, attempting refresh");
  }

  // Access token missing or invalid -> Attempt Refresh
  try {
    const dbRefreshToken = await global.prisma.refreshToken.findFirst({
      where: { userId: decodedRefresh.id },
    });

    if (!dbRefreshToken || dbRefreshToken.refreshToken !== refreshToken) {
      logger.warn(
        `Authorization failed: DB refresh token mismatch for user ${decodedRefresh.id}`,
      );
      clearCookie(res, "refreshToken");
      clearCookie(res, "accessToken");
      return req._error("Unauthorized: Invalid refresh token", 401);
    }

    // Refresh valid -> Generate new Access Token
    const newAccessToken = generateAccessToken(decodedRefresh.id, "user");
    logger.info(`Generated new access token for user: ${decodedRefresh.id}`);

    // Update latest access token in DB (optional security measure, can be relaxed for high concurrency)
    await global.prisma.refreshToken.update({
      where: { id: dbRefreshToken.id },
      data: { accessToken: newAccessToken },
    });

    setCookie(res, "accessToken", newAccessToken, {
      expires: new Date(Date.now() + 6 * 60 * 60 * 1000), // Match auth service (6h) or reduce to match token life
    });

    const user = await setUserToRequest(decodedRefresh.id);

    if (!user) {
      logger.warn(
        `Authorization failed: User not found for ID ${decodedRefresh.id}`,
      );
      clearCookie(res, "refreshToken");
      clearCookie(res, "accessToken");
      return req._error("Unauthorized: User not found", 401);
    }
    req.user = user;
    logger.info(`User authorized via refresh token: ${user.id}`);

    next();
  } catch (error) {
    logger.error(error, "Authorization error");
    return req._error("Unauthorized: Server error during auth", 500);
  }
}
