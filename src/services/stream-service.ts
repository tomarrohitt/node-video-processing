import fs from "fs";
import { Request, Response } from "express";

export class VideoStreamService {
  static async streamVideo(req: Request, res: Response, videoPath: string) {
    try {
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "video/mp4",
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Full video stream
        const head = {
          "Content-Length": fileSize,
          "Content-Type": "video/*",
        };

        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (error) {
      res.status(404).json({ error: "Video not found" });
    }
  }

  static async streamThumbnail(
    req: Request,
    res: Response,
    thumbnailPath: string
  ) {
    try {
      const stat = fs.statSync(thumbnailPath);

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "public, max-age=1800"); // Cache for 1 hour

      fs.createReadStream(thumbnailPath).pipe(res);
    } catch (error) {
      res.status(404).json({ error: "Thumbnail not found" });
    }
  }
}
