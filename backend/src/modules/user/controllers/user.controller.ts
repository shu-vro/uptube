import { Request } from "express";
import { PrismaClient } from "generated/prisma";
import { asyncHandler } from "utils/async-handler";
import { passwordHash } from "utils/auth-utils";

const prisma = new PrismaClient();

export const getUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  req._success(user);
});

export const createUser = asyncHandler(async (req: Request) => {
  const { email, name, password } = req.body;
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password,
    },
  });
  req._success(user, 201);
});

export const updateUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  const { email, name, password } = req.body;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      email,
      name,
      password: await passwordHash(password),
    },
  });

  // req.cookies.user =
  req._success(user, 200);
});

export const deleteUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  await prisma.user.delete({
    where: { id: userId },
  });
  req._success("User deleted", 204);
});
