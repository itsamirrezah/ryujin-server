import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './service/auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
