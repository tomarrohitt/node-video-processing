import { QueueEvents } from "bullmq";

const queueEvents = new QueueEvents("video-queue");

queueEvents.on("failed", ({ failedReason }: { failedReason: string }) => {
  console.error("error painting", failedReason);
});
