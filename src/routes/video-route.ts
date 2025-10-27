import { Router } from "express";
import { upload } from "../middlewares/upload-middleware";
import {
  getStatus,
  handleUpload,
  initializeUpload,
} from "../controller/video-controller";

const router = Router();

router.post("/upload", initializeUpload, upload.single("video"), handleUpload);
router.get("/status/:videoId", getStatus);

export default router;
