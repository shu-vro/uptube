import { Router } from "express";
import protectedRouter from "./protectedRouter.route";
import publicRouter from "./public.route";
import adminRouter from "./adminRouter.route";

const router = Router();

// router.use("/users", userRouter);
router.use("/protected", protectedRouter);
router.use("/public", publicRouter);
router.use("/admin", adminRouter);

export default router;
