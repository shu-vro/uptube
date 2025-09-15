import { Router } from "express";
import { getVideoInfo } from "../controllers/yt.controller";

const router = Router();

router.get("/video/:id", async (req, res) => {
  const videoId = req.params.id;
  const videoInfo = await getVideoInfo(videoId);
  res.json(videoInfo);
});

export default router;
