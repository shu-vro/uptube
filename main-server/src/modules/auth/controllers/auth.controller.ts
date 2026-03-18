import { Request, Response } from "express";
import { authorizeUserOnLogin, validateUser } from "../services/auth.service";
import { passwordHash } from "utils/auth-utils";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { isPasswordStrong } from "utils/auth-utils/password-strength";
import { generateAccessAndRefreshTokens } from "utils/auth-utils/token-generation";

export async function login(req: Request, res: Response) {
  const safeParse = loginSchema.safeParse(req.body);
  if (!safeParse.success) {
    return req._error(`Invalid input: ${safeParse.error.message}`, 400);
  }
  const { email, password } = safeParse.data;

  const user = await validateUser(email, password);

  if (!user) {
    return req._error("Invalid email or password", 401);
  }

  await authorizeUserOnLogin(user.id, res);

  // generateAccessAndRefreshTokens({ userId: user.id, res, type: "user" });
  return req._success({ message: "Logged in successfully" });
}
export async function register(req: Request, res: Response) {
  const safeParse = registerSchema.safeParse(req.body);
  if (!safeParse.success) {
    return req._error(`Invalid input: ${safeParse.error.message}`, 400);
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

  return req._success({ message: "Registered successfully" });
}
