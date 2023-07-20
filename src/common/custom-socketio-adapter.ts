import { IoAdapter } from "@nestjs/platform-socket.io"
import { sessionMiddleware } from "src/main";

export class CustomSocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options)
    server.engine.use(sessionMiddleware)
    return server
  }
}
