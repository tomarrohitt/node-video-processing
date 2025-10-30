import { Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";
import { videoQueue } from "../queues/video-queue";
import { RedisService } from "../services/redis-service";

export class SocketServer {
  private static instance: SocketServer;
  public io: SocketIOServer;

  private constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      sendStats(socket);

      const interval = setInterval(() => {
        sendStats(socket);
      }, 5000);

      socket.on("disconnect", () => {
        clearInterval(interval);
      });
    });

    const redisSubscriber = RedisService.getInstance().subscriber;
    redisSubscriber.subscribe("compression-progress");
    redisSubscriber.on("message", (channel, message) => {
      if (channel === "compression-progress") {
        const { progress, videoId } = JSON.parse(message);
        this.io.emit("compression-progress", { progress, videoId });
      }
    });
  }

  public static getInstance(httpServer?: HTTPServer): SocketServer {
    if (!SocketServer.instance && httpServer) {
      SocketServer.instance = new SocketServer(httpServer);
    }
    return SocketServer.instance;
  }
}

async function sendStats(socket: Socket) {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      videoQueue.getWaitingCount(),
      videoQueue.getActiveCount(),
      videoQueue.getCompletedCount(),
      videoQueue.getFailedCount(),
      videoQueue.getDelayedCount(),
    ]);

    const [waitingJobs, activeJobs, failedJobs] = await Promise.all([
      videoQueue.getWaiting(),
      videoQueue.getActive(),
      videoQueue.getFailed(),
    ]);

    socket.emit("stats", {
      counts: { waiting, active, completed, failed, delayed },
      waitingJobs: waitingJobs.map((job) => ({ id: job.id, data: job.data })),
      activeJobs: activeJobs.map((job) => ({ id: job.id, data: job.data })),
      failedJobs: failedJobs.map((job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
      })),
    });
  } catch (error) {
    console.error("Error sending stats:", error);
  }
}
