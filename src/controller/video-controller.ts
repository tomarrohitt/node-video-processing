import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";
import { videoStatusStore } from "../store/status";
import { VideoService } from "../services/video-service";
import { config } from "../config";

export function initializeUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const videoId = randomUUID();
  videoStatusStore.set(videoId, { status: "uploading", progress: 0 });

  req.videoId = videoId;
  next();
}

export function handleUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (req.fileValidatorError) {
      return res.status(400).json({ message: req.fileValidatorError });
    }

    const videoId = req.videoId;

    if (!videoId) {
      console.error("Video directory not set - middleware failed");
      return res.status(500).json({
        message: "Internal server error - upload configuration failed",
      });
    }

    res.status(202).json({
      message: "Video uploaded successfully",
      videoId,
      status: "Processing",
      statusUrl: `http://localhost:${config.port}/api/status/${videoId}`,
    });

    VideoService.processVideoAsync(
      `./uploads/${videoId}`,
      req.file,
      videoStatusStore
    );
  } catch (error) {
    console.error("upload error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export function getStatus(req: Request, res: Response): void {
  const videoId = req.params.videoId;
  const status = videoStatusStore.get(videoId);

  if (!status) {
    res.status(404).json({ message: "Video not found or expired" });
    return;
  }

  res.json({
    videoId,
    ...status,
  });
}
