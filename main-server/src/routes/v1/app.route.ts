import { Router } from "express";
import protectedRouter from "./routes/protectedRouter.route";
import publicRouter from "./routes/public.route";
import adminRouter from "./routes/adminRouter.route";

const router = Router();

// router.use("/users", userRouter);
router.use("/protected", protectedRouter);
router.use("/public", publicRouter);
router.use("/admin", adminRouter);

router.get("/health", (req) => {
  req._success({ status: "healthy" });
});

export default router;
