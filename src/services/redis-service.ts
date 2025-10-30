import IORedis from "ioredis";
import { config } from "../config";

export class RedisService {
  private static instance: RedisService;
  public publisher: IORedis;
  public subscriber: IORedis;

  private constructor() {
    this.publisher = new IORedis({
      host: config.redisHost,
      port: config.redisPort,
      maxRetriesPerRequest: null,
    });
    this.subscriber = this.publisher.duplicate();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async setWithExpiry(
    key: string,
    value: string,
    ttlSeconds: number = 600
  ): Promise<void> {
    const pipeline = this.publisher.pipeline();
    pipeline.set(key, value);
    pipeline.expire(key, ttlSeconds);
    await pipeline.exec();
  }
}
