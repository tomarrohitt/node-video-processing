import fs from "fs";
import multer from "multer";

const allowedMimeTypes = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
];
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const videoDir = `./uploads/${req.videoId}`;

    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    cb(null, videoDir);
  },
  filename(_req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter(_req, file, cb) {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 },
});

export { upload };
