import { Router } from "express";
import protectedRouter from "./protectedRouter.route";
import publicRouter from "./public.route";
import adminRouter from "./adminRouter.route";
import featuresRouter from "./features.route";

const router = Router();

// router.use("/users", userRouter);
router.use("/protected", protectedRouter);
router.use("/public", publicRouter);
router.use("/admin", adminRouter);
/**
 * @openapi
 * /api/v1/features:
 *  get:
 *     summary: Get feature flags and encryption public key
 */
router.use("/features", featuresRouter);

export default router;
