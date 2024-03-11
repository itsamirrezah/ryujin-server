import { Injectable } from "@nestjs/common";
import { RedisService } from "src/common/redis.service";

@Injectable()
export class EmailVerificationService {
  constructor(private readonly redisService: RedisService) { }


  async setVerificationKey(userId: string, key: string, ttlInSeconds: number): Promise<void> {
    if (!userId || !key) throw new Error("no userId or key")
    await this.redisService.set(`email-verification-${userId}`, key, "EX", ttlInSeconds)
  }

  async getVerificationKey(userId: string): Promise<{ key: string, ttl: number }> {
    if (!userId) throw new Error("no userId provided")
    const [key, ttl] = await Promise.all([
      this.redisService.get(`email-verification-${userId}`),
      this.redisService.ttl(`email-verification-${userId}`)
    ])
    return { key, ttl }
  }
}
