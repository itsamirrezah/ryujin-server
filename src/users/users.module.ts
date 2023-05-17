import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, PrismaClient],
  exports: [UsersService],
})
export class UsersModule {}
