import { MailerService } from '@nestjs-modules/mailer';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { excludeUserSensetiveKeys } from 'src/common/utils';
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

  async signUp(email: string, username: string, password: string) {
    const existUser = await this.userService.findOne({ email, username })
    if (existUser) throw new ConflictException('User already exists')
    const hash = await this.hashingService.hash(password)
    const createdUser = await this.userService.create({ email, username, password: hash })
    return createdUser
  }

  async signin(emailOrUsername: string, password: string) {
    const user = await this.validateUser(emailOrUsername, password)
    if (!user.emailConfirmed) {
      this.sendVerificationEmail(user.id, user.email)
      return new UnauthorizedException('email not confirmed yet')
    }
    if (!user) return new UnauthorizedException('password or username is wrong')
    return user
  }

  async validateUser(usernameOrEmail: string, password: string) {
    const user = await this.userService.findOne({ email: usernameOrEmail, username: usernameOrEmail })
    if (!user) throw new NotFoundException('User not found')
    const isMatch = await this.hashingService.compare(password, user.password)
    if (!isMatch) return null
    return excludeUserSensetiveKeys(user)
  }

  async validateGoogleUser(email: string, googleId: string) {
    const user = await this.userService.findOne({ email, googleId })
    if (user) return excludeUserSensetiveKeys(user);
    return await this.userService.create({ email, googleId, emailConfirmed: true })
  }
  async signInWithGoogleToken(token: string) {
    const { email, sub: googleId } = await this.googleAuthService.verifyByAccessToken(token)
    return this.validateGoogleUser(email, googleId)
  }

  async sendVerificationEmail(userId: string, userEmail: string) {
    const token = this.jwtService.sign(
      { user: { id: userId }, },
      {
        secret: process.env.JWT_VERIFY_SECRET,
        expiresIn: '15m'
      },
    )
    const verifyLink = `${process.env.HOST}/auth/verify?token=${token}`
    await this.mailService.sendMail({
      from: 'ryujin@ryujin.dev',
      subject: 'Verification Link',
      to: userEmail,
      html: `<p>Your Verification Link: <a href=${verifyLink}>Click Here</a></p>`
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
