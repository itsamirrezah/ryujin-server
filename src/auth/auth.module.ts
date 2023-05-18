import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './passport/local.strategy';
import { AuthService } from './service/auth.service';
import { HashingService } from './service/hashing.service';
import { ScryptService } from './service/scrypt.service';

@Module({
  imports: [UsersModule, PassportModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    {
      provide: HashingService,
      useClass: ScryptService
    }
  ]
})
export class AuthModule { }
