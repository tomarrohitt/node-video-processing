import { spawn } from "node:child_process";
import { VideoStatusStore, videoStatusStore } from "../store/status";
import path from "node:path";
import { VideoMetadata } from "../types";
import { config } from "../config";

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

  static async getResolutions(
    fullPath: string,
    parsedPath: path.ParsedPath,
    resolution: {
      width: number;
      height: number;
      name: string;
      bitrate: string;
    },
    duration: number,
    videoStatusStore: VideoStatusStore
  ) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(
        parsedPath.dir,
        `${parsedPath.name}-${resolution.height}${parsedPath.ext}`
      );
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        fullPath,
        "-vf",
        `scale=${resolution.width}:${resolution.height}`,
        "-c:v",
        "libx265",
        "-crf",
        "28",
        "-preset",
        "fast",
        "-b:v",
        resolution.bitrate,
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-y",
        outputPath,
      ]);

      ffmpeg.stderr.on("data", (data) => {
        const output = data.toString();

        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        if (timeMatch && duration > 0) {
          const [, hours, minutes, seconds, milliseconds] = timeMatch;
          const currentTime =
            +hours * 3600 + +minutes * 60 + +seconds + +milliseconds / 100;

          const progress = Math.min((currentTime / duration) * 100, 100);

          videoStatusStore.set(fullPath.split("/")[1], {
            status: "compressing",
            progress: `${progress.toFixed(1)}%`,
          });
        }
      });

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

  static async compressVideo(
    fullPath: string,
    duration: number,
    height: number,
    videoStatusStore: VideoStatusStore
  ) {
    const parsedPath = path.parse(fullPath);

    const targetResolutions = config.resolutions.filter(
      (resolution) => resolution.height <= height
    );

    if (targetResolutions.length === 0) {
      throw new Error("Source video resolution is too low for compression");
    }

    const outputPromises = targetResolutions.map((resolution) =>
      this.getResolutions(
        fullPath,
        parsedPath,
        resolution,
        duration,
        videoStatusStore
      )
    );

    const outputs = await Promise.all(outputPromises);

    return outputs.filter((output) => output !== null) as string[];
  }

  static async getMetadata(fullPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,bitrate,duration,codec",
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
