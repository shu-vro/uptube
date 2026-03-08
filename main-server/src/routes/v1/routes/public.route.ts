import { Router } from "express";
import userRouter from "@/modules/user/routers/user.public.route";
import ytRouter from "@/modules/yt/routers/yt.public.route";
import featuresRouter from "./public_router/features.route";

const router = Router();

/**
 * @openapi
 * /api/v1/public/features:
 *  get:
 *     summary: Get feature flags and encryption public key
 */
router.use("/features", featuresRouter);
router.use("/users", userRouter);
router.use("/yt", ytRouter);

export default router;
