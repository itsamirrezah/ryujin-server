import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
    return user
  }
}
