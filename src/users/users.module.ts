import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RedisService } from 'src/common/redis.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaClient, RedisService],
  exports: [UsersService],
})
export class UsersModule { }
