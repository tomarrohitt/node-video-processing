import { Queue } from "bullmq";
import { RedisService } from "../services/redis-service";

const redisService = RedisService.getInstance();
const connection = redisService.publisher;

export const videoQueue = new Queue("video-queue", { connection });

videoQueue.on("error", (error) => {
  console.error("Queue error", error);
});
