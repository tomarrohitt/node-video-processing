import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: "localhost",
  port: 6379,
});

export const videoQueue = new Queue("video-queue", { connection });

videoQueue.on("error", (error) => {
  console.error("Queue error", error);
});
videoQueue.on("waiting", (job) => {
  console.log(`Job with jobId:${job?.id} is waiting`);
});
videoQueue.on("progress", (job, progress) => {
  console.log(`Job with jobId:${job?.id} has completed ${progress}%`);
});
