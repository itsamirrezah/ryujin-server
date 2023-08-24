import { MailerService } from '@nestjs-modules/mailer';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UserConflictError } from 'src/common/errors';
import { excludeUserSensetiveKeys, UserSanitized } from 'src/common/utils';
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

  async signin(emailOrUsername: string, password: string) {
    const user = await this.validateUser(emailOrUsername, password)
    if (!user.emailConfirmed) {
      this.sendEmailVerificationLink(user.id, user.email)
      return new UnauthorizedException('email not confirmed yet')
    }
    if (!user) return new UnauthorizedException('password or username is wrong')
    return user
  }

  async validateUser(usernameOrEmail: string, password: string) {
    const user = await this.userService.findOne({ email: usernameOrEmail, username: usernameOrEmail }, false)
    if (!user) throw new NotFoundException('User not found')
    //FIXME: attempt to signin for a existing google account
    const isMatch = await this.hashingService.compare(password, user.password)
    if (!isMatch) return null
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
