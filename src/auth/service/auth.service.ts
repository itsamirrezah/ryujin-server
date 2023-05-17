import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { HashingService } from './hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
  ) { }

  async signUp(email: string, username: string, password: string) {
    const user = await this.userService.findOneByEmailOrUsername(email, username)
    if (user) throw new ConflictException('User already exists')
    const hash = await this.hashingService.hash(password)
    return user 
  }
}
