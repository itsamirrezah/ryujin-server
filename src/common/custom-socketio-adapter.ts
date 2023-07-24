import { INestApplicationContext, Injectable } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io"
import { sessionMiddleware } from "src/main";
import { RedisService } from "./redis.service";

@Injectable()
export class CustomSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly redisService: RedisService
  ) {
    super(app)
  }
  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options)
    server.engine.use(sessionMiddleware(this.redisService))
    return server
  }
}
