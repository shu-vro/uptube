import { Router } from "express";
import {
  addVideoToBookmark,
  createBookmark,
  deleteBookmark,
  getBookmarkVideos,
  getHistory,
  getLikes,
  getOverview,
  getVideoStatus,
  listBookmarks,
  recordHistory,
  removeVideoFromBookmark,
  renameBookmark,
  toggleLike,
} from "../controllers/library.controller";

const router = Router();

router.get("/overview", getOverview);
router.get("/history", getHistory);
router.post("/history", recordHistory);
router.get("/likes", getLikes);
router.post("/likes/:videoId", toggleLike);
router.get("/videos/:videoId/status", getVideoStatus);
router.get("/bookmarks", listBookmarks);
router.post("/bookmarks", createBookmark);
router.patch("/bookmarks/:id", renameBookmark);
router.delete("/bookmarks/:id", deleteBookmark);
router.get("/bookmarks/:id/videos", getBookmarkVideos);
router.post("/bookmarks/:id/videos/:videoId", addVideoToBookmark);
router.delete("/bookmarks/:id/videos/:videoId", removeVideoFromBookmark);

export default router;
