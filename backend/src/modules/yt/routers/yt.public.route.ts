import { Router } from "express";
import {
  doSomething,
  getVideoInfo,
  home,
  searchVideos,
  showSuggestions,
} from "../controllers/yt.controller";

const router = Router();

router.get("/video", getVideoInfo);
router.get("/search", searchVideos);
router.get("/home", home);
router.get("/show-suggestions", showSuggestions);
router.get("/do-something", doSomething);

export default router;
