import express from "express";

import router from "./src/routes/video-route";
import { config } from "./src/config";

const app = express();
app.use(express.json());

app.use("/api", router);

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(config.port, () => {
  console.log("Server is running on port 4000");
});
