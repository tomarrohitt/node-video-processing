import fs from "fs";
import multer from "multer";
import { config } from "../config/index";

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
  fileFilter(req, file, cb) {
    if (config.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      req.fileValidatorError = `Invalid file type: ${file.mimetype}. Allowed types: ${config.allowedMimeTypes.join(", ")}`;
      cb(null, false);
    }
  },
  limits: { fileSize: config.fileSize },
});

export { upload };
