import { Router } from "express";
import userRouter from "@/modules/user/routers/user.protected.route";
import authorizeUser from "middlewares/auth/authorization/user";
import { authenticate } from "middlewares/auth";

const router = Router();

router.use(authorizeUser);

router.use("/users", userRouter);

export default router;
