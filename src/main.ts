import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as session from 'express-session'
import { CustomSocketIoAdapter } from './common/custom-socketio-adapter';
import { RedisService } from './common/redis.service';
import { Redis } from 'ioredis';
import RedisStore from 'connect-redis';

type UserSession = {
  id: string,
  email: string,
  username?: string,
  createdAt: Date,
  updatedAt: Date,
  emailConfirmed: boolean
  type: string
}

declare module 'express-session' {
  interface SessionData {
    user: UserSession;
  }
}

export function sessionMiddleware(redisClient: Redis) {
  return session({
    secret: process.env.SESSION_SECRET,
    store: new RedisStore({ client: redisClient }),
    proxy: true,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true
    }
  })
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_HOST, credentials: true })
  app.useGlobalPipes(new ValidationPipe())
  const redisClient = app.get<RedisService>(RedisService).client
  const redisSession = sessionMiddleware(redisClient)
  app.use(redisSession)
  app.useWebSocketAdapter(new CustomSocketIoAdapter(app, redisClient))
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
