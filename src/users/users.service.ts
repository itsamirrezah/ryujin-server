import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { excludeUserSensetiveKeys } from 'src/common/utils';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaClient) { }

  async findOneByEmailOrUsername(email: string, username: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email, },
          { username, },
        ],
      },
    })
    return excludeUserSensetiveKeys(user)
  }

  async create(userArgs: Prisma.UserCreateInput) {
    const { email, username, password } = userArgs
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password,
      },
    })
    if (!user) throw new Error("cannot create user")
    return excludeUserSensetiveKeys(user)
  }
}
