import { Router } from "express";
import userRouter from "@/modules/user/routers/user.public.route";
import ytRouter from "@/modules/yt/routers/yt.public.route";

const router = Router();

router.use("/users", userRouter);
router.use("/yt", ytRouter);

export default router;
