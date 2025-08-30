import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import { passwordHash } from "utils/auth-utils";
const prisma = global.prisma;

export const getUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: {
      password: true,
    },
  });
  req._success(user);
});

export const createUser = asyncHandler(async (req: Request) => {
  const { email, name, password } = req.body;
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: await passwordHash(password),
    },
    omit: {
      password: true,
    },
  });
  req._success(user, 201);
});

export const updateUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  if (req.user?.id !== userId) {
    return req._error("Unauthorized", 403);
  }
  const { email, name, password } = req.body;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      email,
      name,
      password: await passwordHash(password),
    },
    omit: {
      password: true,
    },
  });

  req._success(user);
});

export const deleteUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  if (req.user?.id !== userId) {
    return req._error("Unauthorized", 403);
  }
  await prisma.user.delete({
    where: { id: userId },
  });
  req._success("User deleted");
});
