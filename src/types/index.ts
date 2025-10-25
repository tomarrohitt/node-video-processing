export type VideoStatus =
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "compressing";

export type VideoStatusData = {
  status: VideoStatus;
  progress: number | string;
  error?: string;
  output?: unknown;
};

export type VideoMetadata = string[];
