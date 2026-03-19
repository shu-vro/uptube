import { Request } from "express";
import { asyncHandler } from "utils/async-handler";

export const getUser = asyncHandler(async (req: Request) => {
  const user = req.user;
  req._success(user);
});
