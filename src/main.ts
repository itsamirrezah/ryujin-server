import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as session from 'express-session'
import { CustomSocketIoAdapter } from './common/custom-socketio-adapter';
import { RedisService } from './common/redis.service';
import { Redis } from 'ioredis';
import RedisStore from 'connect-redis';

export function sessionMiddleware(redisClient: Redis) {
  return session({
    secret: process.env.SESSION_SECRET,
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: null,
    }
  })
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: /http:\/\/.*:3000/, credentials: true })
  app.useGlobalPipes(new ValidationPipe())
  const redisClient = app.get<RedisService>(RedisService)
  const redisSession = sessionMiddleware(redisClient)
  app.use(redisSession)
  app.useWebSocketAdapter(new CustomSocketIoAdapter(app, redisClient))
  await app.listen(3001);
}
bootstrap();
