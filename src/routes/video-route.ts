import fs from "fs";
import { Router } from "express";

import { upload } from "../middlewares/upload-middleware";
import { handleUpload, initializeUpload } from "../controller/video-controller";
import { getStats } from "../middlewares/stats-middleware";
import { RedisService } from "../services/redis-service";
import { VideoStreamService } from "../services/stream-service";
import { VideoMetadata } from "../types";

const router = Router();

router.post("/upload", initializeUpload, upload.single("video"), handleUpload);
router.get("/stats", getStats);

router.get("/stream/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const redis = RedisService.getInstance().publisher;
    const videosJson = await redis.get("videos");
    const videos: VideoMetadata[] = videosJson ? JSON.parse(videosJson) : [];

    const video = videos.find((v) => v.id === videoId);

    if (!video || video.outputPath === undefined) {
      return res.status(404).json({ error: "Video not found" });
    }

    await VideoStreamService.streamVideo(req, res, video?.outputPath);
  } catch (error) {
    res.status(500).json({ error: "Stream failed" });
  }
});

router.get("/thumbnail/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const redis = RedisService.getInstance().publisher;
    const videosJson = await redis.get("videos");
    const videos: VideoMetadata[] = videosJson ? JSON.parse(videosJson) : [];
    const video = videos.find((v) => v.id === videoId);

    if (!video || video.thumbnailPath === undefined) {
      return res.status(404).json({ error: "Thumbnail not found" });
    }

    await VideoStreamService.streamThumbnail(req, res, video.thumbnailPath);
  } catch (error) {
    res.status(500).json({ error: "Thumbnail stream failed" });
  }
});

router.get("/download/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;

    const redis = RedisService.getInstance().publisher;
    const videosJson = await redis.get("videos");
    const videos = videosJson ? JSON.parse(videosJson) : [];

    const video = videos.find((v: any) => v.id === videoId);

    if (!video || !video.compressedPath) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Force download
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${videoId}.mp4"`
    );

    fs.createReadStream(video.compressedPath).pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;
