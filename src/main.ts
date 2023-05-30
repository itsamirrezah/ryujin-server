import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as session from 'express-session'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: /http:\/\/.*:3000/, credentials: true })

  app.useGlobalPipes(new ValidationPipe())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: null,
    }
  }))
  await app.listen(3001);
}
bootstrap();
