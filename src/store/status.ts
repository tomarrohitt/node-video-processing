import { VideoStatusData } from "../types";

export class VideoStatusStore {
  private store: Map<string, VideoStatusData>;

  constructor() {
    this.store = new Map();
  }

  set(videoId: string, status: VideoStatusData): void {
    this.store.set(videoId, {
      ...status,
    });
  }

  get(videoId: string): VideoStatusData | undefined {
    return this.store.get(videoId);
  }
}

export const videoStatusStore = new VideoStatusStore();
