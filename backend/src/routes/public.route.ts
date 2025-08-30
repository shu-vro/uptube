import { Router } from "express";
import userRouter from "../modules/user/routers/user.public.route";

const router = Router();

router.use("/users", userRouter);

export default router;
