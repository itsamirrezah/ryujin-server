import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UsersService) { }

  async signUp(email: string, username: string, password: string) {
    const user = await this.userService.findOneByEmailOrUsername(email, username)
    if (user) throw new ConflictException('User already exists')
    return user
  }
}
