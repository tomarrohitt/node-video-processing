import { Worker } from "bullmq";
import IORedis from "ioredis";
import { VideoService } from "../services/video-service";
import { config } from "../config";

const connection = new IORedis({
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "video-queue",
  async (job) => {
    await VideoService.processVideoAsync(job.data);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

worker.on("ready", () => {
  console.log("The worker has started.");
});
