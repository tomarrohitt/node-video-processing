import express from "express";
import cors from "cors";
import { createServer } from "http";
import router from "./src/routes/video-route";
import { config } from "./src/config";
import { SocketServer } from "./src/socket/socket-server";
import { scheduleCleanup } from "./src/workers/cleanup-worker";
import path from "path";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(cors({ origin: config.clientUrl }));

app.use("/api", router);

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

SocketServer.getInstance(httpServer);

async function startApp() {
  try {
    const uploadDirectory = path.join(__dirname, "uploads");
    await scheduleCleanup(uploadDirectory);
    httpServer.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

startApp();
