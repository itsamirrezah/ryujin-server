import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IncorrectCredentials, UserAlreadyExistError, UserConflictError, UserNotFoundError } from 'src/common/errors';
import { UserSanitized } from 'src/common/utils';
import { UsersService } from 'src/users/users.service';
import { GoogleAuthService } from './google-auth.service';
import { HashingService } from './hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly mailService: MailerService,
    private readonly jwtService: JwtService
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

  async validateGoogleUser(email: string, googleId: string) {
    const user = await this.userService.findOne({ email, googleId })
    if (user) return user
    return await this.userService.create({ email, googleId, emailConfirmed: true })
  }
  async signInWithGoogleToken(token: string) {
    const { email, sub: googleId } = await this.googleAuthService.verifyByAccessToken(token)
    return this.validateGoogleUser(email, googleId)
  }

  sendEmailVerificationLink(userId: string, email: string) {
    const token = this.jwtService.sign(
      { user: { id: userId } },
      {
        secret: process.env.JWT_VERIFY_SECRET,
        expiresIn: '24h'
      },
    )
    const verificationLink = `${process.env.HOST}/auth/verify?token=${token}`
    this.mailService.sendMail({
      from: 'ryujin@ryujin.dev',
      subject: 'Please Confirm Your Email Address',
      to: email,
      html: `<p>Your Verification Link: <a href=${verificationLink}>Click Here</a></p>`
    })
  }

  async validateVerificationToken(token: string) {
    const payload = this.jwtService.verify(token, { secret: process.env.JWT_VERIFY_SECRET })
    return payload
  }

  async confirmEmailUser(userId: string) {
    return this.userService.updateOneById(userId, { emailConfirmed: true })
  }
}
