import { Router } from "express";
import protectedRouter from "./protectedRouter.route";
import unprotectedRouter from "./unprotectedRouter.route";
import adminRouter from "./adminRouter.route";

const router = Router();

// router.use("/users", userRouter);
router.use("/protected", protectedRouter);
router.use("/unprotected", unprotectedRouter);
router.use("/admin", adminRouter);

export default router;
