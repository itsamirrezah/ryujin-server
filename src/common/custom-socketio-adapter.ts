import { INestApplicationContext, Injectable } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io"
import Redis from "ioredis";
import { sessionMiddleware } from "src/main";

@Injectable()
export class CustomSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly redisClient: Redis) {
    super(app)
  }
  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options)
    server.engine.use(sessionMiddleware(this.redisClient))
    return server
  }
}
