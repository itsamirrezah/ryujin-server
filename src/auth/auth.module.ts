import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/common/redis.service';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './service/auth.service';
import { EmailVerificationService } from './service/email-verification.service';
import { GoogleAuthService } from './service/google-auth.service';
import { HashingService } from './service/hashing.service';
import { ScryptService } from './service/scrypt.service';

@Module({
  imports: [
    UsersModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      }
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    EmailVerificationService,
    RedisService,
    JwtService,
    {
      provide: HashingService,
      useClass: ScryptService
    }
  ]
})
export class AuthModule { }
