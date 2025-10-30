import { Request, Response } from "express";
import { videoQueue } from "../queues/video-queue";
import { RedisService } from "../services/redis-service";

const redis = RedisService.getInstance().publisher;

export async function getStats(req: Request, res: Response) {
  const [waiting, active, completed, failed, delayed, videosJson] =
    await Promise.all([
      videoQueue.getWaitingCount(),
      videoQueue.getActiveCount(),
      videoQueue.getCompletedCount(),
      videoQueue.getFailedCount(),
      videoQueue.getDelayedCount(),
      redis.get("videos"), // Direct Redis call
    ]);
  const waitingJobs = await videoQueue.getWaiting();
  const activeJobs = await videoQueue.getActive();
  const failedJobs = await videoQueue.getFailed();

  const recentVideos = videosJson ? JSON.parse(videosJson) : [];

  res.json({
    counts: { waiting, active, completed, failed, delayed },
    waitingJobs: waitingJobs.map((job) => ({ id: job.id, data: job.data })),
    activeJobs: activeJobs.map((job) => ({ id: job.id, data: job.data })),
    failedJobs: failedJobs.map((job) => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
    })),
    recentVideos: recentVideos.slice(0, 3),
  });
}
