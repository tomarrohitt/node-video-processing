import { Queue, Worker } from "bullmq";
import fs from "fs/promises";
import { RedisService } from "../services/redis-service";

const redisService = RedisService.getInstance();
const connection = redisService.publisher;

export const cleanupQueue = new Queue("filesystem-cleanup", { connection });

export async function scheduleCleanup(uploadDirectory: string) {
  await cleanupQueue.add(
    "cleanup-uploads",
    { directory: uploadDirectory },
    {
      repeat: {
        pattern: "0 * * * *",
      },
    }
  );
}

export const cleanupWorker = new Worker(
  "filesystem-cleanup",
  async (job) => {
    const { directory } = job.data;

    try {
      await fs.rm(directory, { recursive: true, force: true });
      await fs.mkdir(directory, { recursive: true });

      return { directory };
    } catch (error) {
      console.error("Cleanup job failed:", error);
      throw error;
    }
  },
  { connection }
);
