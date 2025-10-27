import fs from "fs";
import path from "path";
import { FFmpegService } from "./ffmpeg-service";

export class VideoService {
  static async processVideoAsync({ file }: { file: Express.Multer.File }) {
    const fullPath = file.path;
    try {
      const thumbnailPath = `${file.path.split(".").slice(0, -1).join(".")}.png`;
      const metadata = await FFmpegService.getMetadata(fullPath);

      const [width, height] = metadata.map(Number);

      await FFmpegService.makeThumbnail(fullPath, thumbnailPath, width);

      await FFmpegService.compressVideo(fullPath, height);
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
