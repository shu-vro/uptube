import { Router } from "express";
import protectedRouter from "./routes/protectedRouter.route";
import publicRouter from "./routes/public.route";
import adminRouter from "./routes/adminRouter.route";
import { asyncHandler } from "utils/async-handler";

const router = Router();

// router.use("/users", userRouter);
router.use("/protected", protectedRouter);
router.use("/public", publicRouter);
router.use("/admin", adminRouter);

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Check if the server is running and the database connection is working.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-10-27T10:00:00.000Z"
 *                     dbCheck:
 *                       type: string
 *                       enum: ["ok", "error"]
 *                       example: "ok"
 *       500:
 *         description: Server error
 */
router.get(
  "/health",
  asyncHandler(async (req) => {
    req._success({
      status: "healthy",
      timestamp: new Date().toISOString(),
      dbCheck: (await global.prisma.$queryRaw`SELECT 1`) ? "ok" : "error",
    });
  })
);

export default router;
