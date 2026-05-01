import { Request, Response } from "express";
import { authorizeUserOnLogin, validateUser } from "../services/auth.service";
import { passwordHash } from "utils/auth-utils";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { isPasswordStrong } from "utils/auth-utils/password-strength";
import { generateAccessAndRefreshTokens } from "utils/auth-utils/token-generation";
import { clearCookie } from "utils/auth-utils/cookie-manager";

export async function login(req: Request, res: Response) {
  const safeParse = loginSchema.safeParse(req.body);
  if (!safeParse.success) {
    return req._error(
      `Invalid input: ${safeParse.error.issues?.[0]?.message}`,
      400
    );
  }
  const { email, password } = safeParse.data;

  const user = await validateUser(email, password);

  if (!user) {
    return req._error("Invalid email or password", 401);
  }

  await authorizeUserOnLogin(user.id, res);

  return req._success({ user: { id: user.id } }, 200);
}
export async function register(req: Request, res: Response) {
  const safeParse = registerSchema.safeParse(req.body);
  if (!safeParse.success) {
    return req._error(
      `Invalid input: ${safeParse.error.issues?.[0]?.message}`,
      400
    );
  }
  const { name, email, password } = safeParse.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return req._error("Email already in use", 400);
  }

  if (!isPasswordStrong(password)) {
    return req._error(
      "Password is too weak. Please choose a stronger password.",
      400
    );
  }

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: await passwordHash(password),
    },
    select: { id: true },
  });

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens({
    userId: newUser.id,
    res,
    type: "user",
  });

  await prisma.refreshToken.create({
    data: {
      refreshToken: refreshToken,
      accessToken: accessToken,
      userId: newUser.id,
    },
  });

  return req._success({ user: newUser }, 201);
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      await global.prisma.refreshToken.delete({
        where: { refreshToken },
      });
    } catch (error) {
      // Token might be already deleted or invalid, ignore
    }
  }

  clearCookie(res, "accessToken");
  clearCookie(res, "refreshToken");

  return req._success({ message: "Logged out successfully" });
}
