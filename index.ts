import express from "express";

import { upload } from "./src/controller/multer";
import { processVideoAsync } from "./src/controller/ffmpeg";
import { randomUUID } from "crypto";

const videoStatus = new Map<
  string,
  {
    status: "uploading" | "processing" | "completed" | "failed";
    progress: number;
    error?: string;
    outputPath?: string;
  }
>();

const app = express();
app.use(express.json());

app.post(
  "/upload",
  (req, res, next) => {
    const videoId = randomUUID();
    videoStatus.set(videoId, { status: "uploading", progress: 0 });

    req.videoId = videoId;
    next();
  },
  upload.single("video"),
  (req, res) => {
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
        statusUrl: `/status/${videoId}`,
      });

      processVideoAsync(`./uploads/${videoId}`, req.file, videoStatus);
    } catch (error) {
      console.error("upload error", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/status/:videoId", (req, res) => {
  const status = videoStatus.get(req.params.videoId);
  if (!status) {
    return res.status(404).json({ message: "Video not found" });
  }
  res.json(status);
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
