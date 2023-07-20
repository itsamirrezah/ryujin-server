import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as session from 'express-session'
import { CustomSocketIoAdapter } from './common/custom-socketio-adapter';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: null,
  }
})
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: /http:\/\/.*:3000/, credentials: true })

  app.useGlobalPipes(new ValidationPipe())
  app.use(sessionMiddleware)
  app.useWebSocketAdapter(new CustomSocketIoAdapter(app))
  await app.listen(3001);
}
bootstrap();
