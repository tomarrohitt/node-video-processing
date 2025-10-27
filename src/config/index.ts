export const config = {
  port: process.env.PORT || 4000,
  fileSize: 500 * 1024 * 1024, // 500MB
  allowedMimeTypes: [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
  ],
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
};
