import fs from "fs";
import { FFmpegService } from "./ffmpeg-service";
import { RedisService } from "./redis-service";
import { VideoMetadata } from "../types";

const redisPublisher = RedisService.getInstance().publisher;

export class VideoService {
  static async processVideoAsync({ file }: { file: Express.Multer.File }) {
    const fullPath = file.path;

    try {
      const metadata = await FFmpegService.getMetadata(fullPath);
      const result = await redisPublisher.get("videos");

      let videoStore: VideoMetadata[] = [];

      if (result) {
        try {
          const parsed = JSON.parse(result);
          videoStore = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.error("Failed to parse videos from Redis:", error);
          videoStore = [];
        }
      }

      const thumbnailPath = `${file.path.split(".").slice(0, -1).join(".")}.png`;
      await FFmpegService.makeThumbnail(
        fullPath,
        thumbnailPath,
        metadata.width
      );

      const outputPath = await FFmpegService.compressVideo(
        fullPath,
        metadata.duration,
        (progress) => {
          redisPublisher.publish(
            "compression-progress",
            JSON.stringify({ progress })
          );
        }
      );

      videoStore.push({ ...metadata, outputPath, thumbnailPath });

      videoStore = videoStore.slice(-3);

      await redisPublisher.setex("videos", 1200, JSON.stringify(videoStore));
    } catch (e) {
      console.error("Async processing failed", e);

      try {
        fs.rmSync(file.destination, { recursive: true, force: true });
      } catch (e) {
        console.error("Error cleaning up after failure", e);
      }
    }
  }
}
