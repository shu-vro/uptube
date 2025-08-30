import { Router } from "express";
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
