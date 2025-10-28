import { QueueEvents } from "bullmq";

const queueEvents = new QueueEvents("video-queue");

queueEvents.on("completed", ({ jobId }) => {
  console.log(`Job with jobId:${jobId} is completed`);
});

queueEvents.on(
  "failed",
  ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.error("error painting", failedReason);
  }
);
