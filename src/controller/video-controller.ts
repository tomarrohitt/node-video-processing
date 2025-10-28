import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";
import { videoQueue } from "../queues/video-queue";

export function initializeUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const videoId = randomUUID();
  req.videoId = videoId;
  next();
}

export async function handleUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (req.fileValidatorError) {
      return res.status(400).json({ message: req.fileValidatorError });
    }

    await videoQueue.add("process-video", {
      file: req.file,
    });

    const { originalname, mimetype, size } = req.file;
    res.status(202).json({
      status: "processing",
      videoId: req.videoId,
      message:
        "Video uploaded and is now being processed. This may take a few minutes.",
      file: {
        originalName: originalname,
        mimeType: mimetype,
        size,
      },
    });
  } catch (error) {
    console.error("upload error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
