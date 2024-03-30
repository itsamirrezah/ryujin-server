import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConfirmationEmailRequestDelayedException,
  IncorrectCredentials,
  UserAlreadyExistError,
  UserConflictError,
  UserNotFoundError
} from 'src/common/errors';
import { UserSanitized } from 'src/common/utils';
import { UsersService } from 'src/users/users.service';
import { EmailVerificationService } from './email-verification.service';
import { GoogleAuthService } from './google-auth.service';
import { HashingService } from './hashing.service';

type VerificationPayload = {
  user: { id: string }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly mailService: MailerService,
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService
  ) { }

  async signUp(email: string, username: string, password: string): Promise<UserSanitized> {
    const existUser = await this.userService.findOne({ email, username })
    if (existUser) throw new UserConflictError("The provided email or username is already taken. Please choose a different one.")
    const hash = await this.hashingService.hash(password)
    return await this.userService.create({ email, username, password: hash })
  }

  async signin(emailOrUsername: string, password: string): Promise<UserSanitized> {
    const user = await this.userService.findOne({ email: emailOrUsername, username: emailOrUsername }, false)
    if (!user) throw new UserNotFoundError("The credential you entered is not associated with any account, if you don't have an account, please consider signing up.")
    if (user.googleId && !user.password) throw new UserAlreadyExistError("The credentials you provided belongs to a Google-connected account. Please sign with Google to access your account.")
    const isMatch = await this.hashingService.compare(password, user.password)
    if (!isMatch) throw new IncorrectCredentials("The credential you provided is incorrect. Please double check and try again.")
    return user
  }

  async signWithGoogle(token: string): Promise<UserSanitized> {
    const { email, sub: googleId } = await this.googleAuthService.verifyAccessToken(token)
    const user = await this.userService.findOne({ googleId })
    if (user) return user
    return await this.userService.create({ email, googleId, emailConfirmed: true })
  }

  async sendConfirmationEmail(userId: string, email: string) {
    const { key, ttl } = await this.emailVerificationService.getVerificationKey(userId)
    if (key) {
      throw new ConfirmationEmailRequestDelayedException(`wait for ${ttl} seoncds.`, ttl)
    }
    const token = this.jwtService.sign({ user: { id: userId } },
      {
        secret: process.env.JWT_VERIFY_SECRET,
        expiresIn: '5m'
      },
    )
    const verificationLink = `${process.env.HOST}/auth/verify?token=${token}`
    await this.emailVerificationService.setVerificationKey(userId, token, 5 * 60)
    this.mailService.sendMail({
      from: process.env.MAIL_SENDER,
      subject: 'Please Confirm Your Email Address',
      to: email,
      html: `<p>Your Verification Link: <a href=${verificationLink}>Click Here</a></p>`
    })
  }

  async verifyUserEmail(token: string): Promise<UserSanitized> {
    const payload = await this.jwtService.verifyAsync<VerificationPayload>(
      token, { secret: process.env.JWT_VERIFY_SECRET }
    )
    if (!payload && !payload.user) throw new Error("token is invalid")
    return await this.userService.updateOneById(payload.user.id, { emailConfirmed: true })
  }

  async isConfirmationEmailAvailable(userId: string) {
    const { key, ttl } = await this.emailVerificationService.getVerificationKey(userId)
    if (!key) return { isValid: true, ttl };
    return { isValid: false, ttl }
  }
}
