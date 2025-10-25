import path from "node:path";
import { spawn } from "node:child_process";
import { VideoMetaData } from "../types/ffmpeg";

function makeThumbnail(fullPath: string, thumbnailPath: string, width: number) {
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

function compressVideo(
  fullPath: string,
  duration: number,
  videoStatus: Map<
    string,
    { status: string; progress: number; error?: string; outputPath?: string }
  >
) {
  return new Promise((resolve, reject) => {
    const parsedPath = path.parse(fullPath);

    const outputPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-compressed${parsedPath.ext}`.replace(
        parsedPath.ext,
        "-hevc.mp4"
      )
    );

    console.log("Starting compression for:", fullPath);

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

        console.log(`📊 Compression progress: `);
        videoStatus.set(fullPath.split("/")[1], {
          status: "uploading",
          progress: `${progress.toFixed(1)}%` as unknown as number,
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

function getMetadata(fullPath: string): Promise<VideoMetaData> {
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

async function processVideoAsync(
  videoDir: string,
  file: Express.Multer.File,
  VideoStatus: Map<
    string,
    { status: string; progress: number; error?: string; outputPath?: string }
  >
) {
  try {
    const fullPath = file.path;
    const metadata = await getMetadata(fullPath);

    const thumbnailPath = path.join(
      videoDir,
      `${file.originalname.split(".").slice(0, -1).join(".")}.png`
    );

    const [width, height, duration] = metadata.map(Number);

    await makeThumbnail(fullPath, thumbnailPath, width);
    await compressVideo(fullPath, duration, VideoStatus);

    console.log("Processed:", file.filename);
  } catch (e) {
    console.error("Async processing failed", e);
  }
}

export { processVideoAsync };
