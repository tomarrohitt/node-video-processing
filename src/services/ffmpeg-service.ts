import fs from "fs";
import { spawn } from "node:child_process";

import { VideoMetadata } from "../types";
import { getOutputPath } from "../utils/get-output-path";

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

  static async compressVideo(
    fullPath: string,
    duration: number,
    onProgress: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = getOutputPath(fullPath);
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        fullPath,
        "-c:v",
        "libx265",
        "-preset",
        "slow",
        "-crf",
        "20",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        "-tag:v",
        "hvc1",
        "-y",
        outputPath,
      ]);

      let lastUpdate = 0;
      ffmpeg.stderr.on("data", (data) => {
        const now = Date.now();
        if (now - lastUpdate < 700) return; // only update every 300ms
        lastUpdate = now;
        const str = data.toString();
        const timeMatch = str.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (timeMatch) {
          const [h, m, s] = timeMatch[1].split(":").map(parseFloat);
          const current = h * 3600 + m * 60 + s;
          const progress = Math.min((current / duration) * 100, 100);
          onProgress(progress);
        }
      });

      ffmpeg.on("error", (error) => {
        fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });

      ffmpeg.on("close", (code) => {
        ffmpeg.stderr.removeAllListeners();
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Video compression failed: ${code}`));
        }
      });
    });
  }

  static async getMetadata(fullPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        fullPath,
      ]);

      let output = "";
      ffprobe.stdout.on("data", (data) => (output += data.toString()));

      ffprobe.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`FFprobe failed with code: ${code}`));
          return;
        }
        try {
          const data = JSON.parse(output);

          // id: number;
          // fileName: string;
          // duration: number;
          // width: number;
          // height: number;
          // codec: string;
          // bitrate: number;
          // originalSize: number;
          // outputPath: string;
          // format: string;
          // uploadedAt: Date;
          const metadata = {
            id: data.format.filename.split("/")[1] as string,
            fileName: data.format.filename.split("/")[-1] as string,
            duration: parseFloat(data.format.duration),
            width: data.streams[0]?.width as number,
            height: data.streams[0]?.height as number,
            codec: data.streams[0]?.codec_name as string,
            bitrate: parseInt(data.format.bit_rate),
            originalSize: parseInt(data.format.size) as number,
            format: data.format.format_long_name as string,
            uploadedAt: Date.now(),
          };
          resolve(metadata);
        } catch (error) {
          reject(new Error(`Failed to parse FFprobe output: ${error}`));
        }
      });

      ffprobe.on("error", (error) => {
        reject(error);
      });
    });
  }
}
