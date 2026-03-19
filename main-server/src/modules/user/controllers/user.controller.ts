import { Request } from "express";
import { asyncHandler } from "utils/async-handler";

export const getUser = asyncHandler(async (req: Request) => {
  const user = req.user
    ? (({ password, ...safeUser }) => safeUser)(req.user)
    : null;

  console.log(user);

  req._success(user);
});
