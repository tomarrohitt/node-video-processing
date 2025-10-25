export const config = {
  port: process.env.PORT || 4000,
  fileSize: 500 * 1024 * 1024,
  allowedMimeTypes: [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
  ],
  resolutions: [
    { width: 3840, height: 2160, name: "4k", bitrate: "8000k" },
    { width: 1920, height: 1080, name: "1080p", bitrate: "4500k" },
    { width: 1280, height: 720, name: "720p", bitrate: "2500k" },
    { width: 854, height: 480, name: "480p", bitrate: "1200k" },
    { width: 640, height: 360, name: "360p", bitrate: "800k" },
    { width: 426, height: 240, name: "240p", bitrate: "500k" },
    { width: 256, height: 144, name: "144p", bitrate: "300k" },
  ],
};
