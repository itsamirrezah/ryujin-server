import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { excludeUserSensetiveKeys } from 'src/common/utils';
import { UsersService } from 'src/users/users.service';
import { GoogleAuthService } from './google-auth.service';
import { HashingService } from './hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
    private readonly googleAuthService: GoogleAuthService
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
    if (!user) throw new UnauthorizedException('password or username is wrong')
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
    //FIXME: username might be taken
    return await this.userService.create({ username: email, email, googleId })
  }
  async signInWithGoogleToken(token: string) {
    const { email, sub: googleId } = await this.googleAuthService.verifyByAccessToken(token)
    return this.validateGoogleUser(email, googleId)
  }
}
