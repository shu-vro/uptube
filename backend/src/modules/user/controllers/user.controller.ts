import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import { passwordHash } from "utils/auth-utils";
const prisma = global.prisma;

export const getUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (user) {
    const { password, ...userWithoutPassword } = user;
    req._success(userWithoutPassword);
    return;
  }
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
  });
  const { password: _password, ...userWithoutPassword } = user;
  req._success(userWithoutPassword, 201);
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

  const { password: _password, ...userWithoutPassword } = user;
  req._success(userWithoutPassword, 200);
});

export const deleteUser = asyncHandler(async (req: Request) => {
  const userId = req.params.id;
  await prisma.user.delete({
    where: { id: userId },
  });
  req._success("User deleted", 200);
});
