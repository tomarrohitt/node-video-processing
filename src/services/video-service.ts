import fs from "fs";
import path from "path";
import { VideoStatusStore } from "../store/status";
import { FFmpegService } from "./ffmpeg-service";

export class VideoService {
  static async processVideoAsync(
    videoDir: string,
    file: Express.Multer.File,
    videoStatusStore: VideoStatusStore
  ) {
    const fullPath = file.path;
    const videoId = fullPath.split("/")[1];
    const thumbnailPath = path.join(
      videoDir,
      `${file.originalname.split(".").slice(0, -1).join(".")}.png`
    );

    try {
      const metadata = await FFmpegService.getMetadata(fullPath);

      const [width, height, duration] = metadata.map(Number);

      await FFmpegService.makeThumbnail(fullPath, thumbnailPath, width);

      videoStatusStore.set(videoId, {
        status: "processing",
        progress: 30,
      });

      const output = (await FFmpegService.compressVideo(
        fullPath,
        duration,
        height,
        videoStatusStore
      )) as unknown;

      videoStatusStore.set(videoId, {
        status: "completed",
        progress: 100,
        output,
      });
    } catch (e) {
      console.error("Async processing failed", e);

      try {
        fs.rmSync(videoDir, { recursive: true, force: true });
        videoStatusStore.set(videoId, {
          status: "failed",
          progress: 0,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      } catch (e) {
        console.error("Error cleaning up after failure", e);
      }
    }
  }
}
