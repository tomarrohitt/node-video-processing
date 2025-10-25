import path from "node:path";
import { spawn } from "node:child_process";

function makeThumbnail(
  fullPath: string,
  thumbnailPath: string,
  dimensions: string,
) {
  return new Promise((resolve, reject) => {
    const [width, _height] = (dimensions as string)
      .trim()
      .split("x")
      .map(Number);
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
        resolve(true);
      } else {
        reject(new Error(`Thumbnail creation failed: ${code}`));
      }
    });
  });
}

function compressVideo(fullPath: string) {
  return new Promise((resolve, reject) => {
    const parsedPath = path.parse(fullPath);

    const outputPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-compressed${parsedPath.ext}`,
    );

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      fullPath,
      "-c:v",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "slow",
      "-profile:v",
      "high",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-y",
      outputPath,
    ]);
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject("Error");
      }
    });
  });
}

function getDimensions(fullPath: string) {
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

    let dimensions = "";
    ffprobe.stdout.on("data", (data) => {
      dimensions += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        resolve(dimensions);
      } else {
        reject(new Error(`FFprobe existed with this code: ${code}`));
      }
    });

    ffprobe.on("error", (error) => {
      reject(error);
    });
  });
}

async function processVideoAsync(videoDir: string, file: Express.Multer.File) {
  try {
    const fullPath = file.path;
    const dimensions = (await getDimensions(fullPath)) as string;

    const thumbnailPath = path.join(
      videoDir,
      `${file.originalname.split(".").slice(0, -1).join(".")}.png`,
    );

    await makeThumbnail(fullPath, thumbnailPath, dimensions);
    await compressVideo(fullPath);

    console.log("Processing:", file.filename);
  } catch (e) {
    console.error("Async processing failed", e);
  }
}

export { processVideoAsync };
