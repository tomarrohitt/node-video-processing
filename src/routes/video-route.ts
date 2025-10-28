import { Router } from "express";
import { upload } from "../middlewares/upload-middleware";
import { handleUpload, initializeUpload } from "../controller/video-controller";
import { videoQueue } from "../queues/video-queue";

const router = Router();

router.post("/upload", initializeUpload, upload.single("video"), handleUpload);
router.get("/stats", async (req, res) => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
    videoQueue.getDelayedCount(),
  ]);
  const waitingJobs = await videoQueue.getWaiting();
  const activeJobs = await videoQueue.getActive();
  const failedJobs = await videoQueue.getFailed();

  res.json({
    counts: { waiting, active, completed, failed, delayed },
    waitingJobs: waitingJobs.map((job) => ({ id: job.id, data: job.data })),
    activeJobs: activeJobs.map((job) => ({ id: job.id, data: job.data })),
    failedJobs: failedJobs.map((job) => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
    })),
  });
});

export default router;
