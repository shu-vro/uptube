import { Router } from "express";
import {
  doSomething,
  getVideoInfo,
  home,
  searchVideos,
} from "../controllers/yt.controller";

const router = Router();

router.get("/video", getVideoInfo);
router.get("/search", searchVideos);
router.get("/home", home);
router.get("/do-something", doSomething);

export default router;
