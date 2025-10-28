import { spawn } from "node:child_process";
import path from "node:path";
import { VideoMetadata } from "../types";

export class FFmpegService {
  static async makeThumbnail(
    fullPath: string,
    thumbnailPath: string,
    width: number
  ) {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        fullPath,
        "-vf",
        `thumbnail,scale=${width}:-1`,
        "-frames:v",
        "1",
        thumbnailPath,
      ]);

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve(thumbnailPath);
        } else {
          reject(new Error(`Thumbnail creation failed: ${code}`));
        }
      });
    });
  }

  static async getResolution(
    fullPath: string,
    parsedPath: path.ParsedPath,
    resolution: number
  ) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(
        parsedPath.dir,
        `${parsedPath.name}-${resolution}${parsedPath.ext}`
      );
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        fullPath,
        "-c:v",
        "libx265",
        "-crf",
        "28",
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-tag:v",
        "hvc1",
        "-y",
        outputPath,
      ]);

      ffmpeg.on("error", (error) => {
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Video compression failed: ${code}`));
        }
      });
    });
  }

  static async compressVideo(fullPath: string, height: number) {
    const parsedPath = path.parse(fullPath);

    return this.getResolution(fullPath, parsedPath, height);
  }

  static async getMetadata(fullPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=s=x:p=0",
        fullPath,
      ]);

      let metadataStr = "";
      ffprobe.stdout.on("data", (data) => {
        metadataStr += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code === 0) {
          const metadata = metadataStr.trim().split("x");
          resolve(metadata);
        } else {
          reject(new Error(`FFprobe existed with this code: ${code}`));
        }
      });

      ffprobe.on("error", (error) => {
        reject(error);
      });
    });
  }
}
