export type VideoStatus =
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "compressing";

export type VideoMetadata = {
  id: string;
  fileName: string;
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  originalSize: number;
  outputPath?: string;
  thumbnailPath?: string;
  format: string;
  uploadedAt: number;
};
