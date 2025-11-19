import { Router } from "express";
import userRouter from "@/modules/user/routers/user.protected.route";
import { authenticate } from "middlewares/auth";

const router = Router();

router.use(authenticate);

router.use("/users", userRouter);

export default router;
