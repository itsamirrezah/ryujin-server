import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { PlayModule } from '../play/play.module';
import { RedisService } from 'src/common/redis.service';

@Module({
  imports: [UsersModule, AuthModule, PlayModule],
  controllers: [AppController],
  providers: [AppService, RedisService],
  exports: [RedisService]
})
export class AppModule { }
