import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: Redis

  async onModuleInit() {
    this.client = new Redis({ port: 6379, host: process.env.REDIS_HOST })
  }

  async onModuleDestroy() {
    this.client.disconnect()
  }
}
