import { Worker } from "bullmq";
import { VideoService } from "../services/video-service";
import { RedisService } from "../services/redis-service";

const redisService = RedisService.getInstance();
const connection = redisService.publisher;

const worker = new Worker(
  "video-queue",
  async (job) => {
    await VideoService.processVideoAsync(job.data);
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
