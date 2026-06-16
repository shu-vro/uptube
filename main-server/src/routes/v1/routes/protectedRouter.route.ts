import { Router } from "express";
import userRouter from "@/modules/user/routers/user.protected.route";
import libraryRouter from "@/modules/library/routers/library.protected.route";
import authorizeUser from "middlewares/auth/authorization/user";

const router = Router();

router.use(authorizeUser);

router.use("/users", userRouter);
router.use("/library", libraryRouter);

export default router;
