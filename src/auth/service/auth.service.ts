import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { excludeUserSensetiveKeys } from 'src/common/utils';
import { UsersService } from 'src/users/users.service';
import { HashingService } from './hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
  ) { }

  async signUp(email: string, username: string, password: string) {
    const existUser = await this.userService.findOneByEmailOrUsername(email, username)
    if (existUser) throw new ConflictException('User already exists')
    const hash = await this.hashingService.hash(password)
    const createdUser = await this.userService.create({ email, username, password: hash })
    return createdUser
  }

  async validateUser(usernameOrEmail: string, password: string) {
    const user = await this.userService.findOneByEmailOrUsername(usernameOrEmail, usernameOrEmail)
    if (!user) throw new NotFoundException('User not found')
    const isMatch = await this.hashingService.compare(password, user.password)
    if (!isMatch) return null
    return excludeUserSensetiveKeys(user)
  }
}
