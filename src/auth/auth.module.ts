import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './service/auth.service';
import { HashingService } from './service/hashing.service';
import { ScryptService } from './service/scrypt.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: HashingService,
      useClass: ScryptService
    }
  ]
})
export class AuthModule { }
