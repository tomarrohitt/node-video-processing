import express, { NextFunction } from "express";
import { randomUUID } from "node:crypto";

import { upload } from "./src/controller/multer";
import { processVideoAsync } from "./src/controller/ffmpeg";

const app = express();
app.use(express.json());

app.post(
  "/upload",
  (req, res, next) => {
    const videoId = randomUUID();
    (req as any).videoDir = `./uploads/${videoId}`;
    next();
  },
  upload.single("video"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if ((req as any).fileValidatorError) {
        return res
          .status(400)
          .json({ message: (req as any).fileValidatorError });
      }

      const videoDir = (req as any).videoDir;

      res.status(202).json({
        message: "Video uploaded successfully",
        videoDir,
        status: "Processing",
      });

      processVideoAsync(videoDir, req.file);
    } catch (error) {
      console.error("upload error", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
