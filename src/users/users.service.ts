import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { excludeUserSensetiveKeys } from 'src/common/utils';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaClient) { }

  async findOne(userArgs: Prisma.UserWhereUniqueInput) {
    const expression = Object.keys(userArgs).map(key => {
      return { [key]: userArgs[key] }
    })
    if (expression.length === 0) throw new Error("bad argument")

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...expression,
        ],
      },
    })
    return user
  }

  async create(userArgs: Prisma.UserCreateInput) {
    const user = await this.prisma.user.create({
      data: { ...userArgs },
    })
    if (!user) throw new Error("cannot create user")
    return excludeUserSensetiveKeys(user)
  }

  async updateOneById(id: string, userArgs: Prisma.UserUpdateInput) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { ...userArgs }
    })
    return excludeUserSensetiveKeys(user)
  }
}
