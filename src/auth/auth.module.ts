import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './passport/google.strategy';
import { LocalStrategy } from './passport/local.strategy';
import { SessionSerialize } from './passport/session.serialize';
import { AuthService } from './service/auth.service';
import { GoogleAuthService } from './service/google-auth.service';
import { HashingService } from './service/hashing.service';
import { ScryptService } from './service/scrypt.service';

@Module({
  imports: [UsersModule, PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    GoogleStrategy,
    SessionSerialize,
    GoogleAuthService,
    {
      provide: HashingService,
      useClass: ScryptService
    }
  ]
})
export class AuthModule { }
