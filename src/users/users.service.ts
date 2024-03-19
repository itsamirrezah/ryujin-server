import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, User } from '@prisma/client';
import { SessionData } from 'express-session';
import { RedisService } from 'src/common/redis.service';
import { excludeUserSensetiveKeys, UserSanitized } from 'src/common/utils';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redisService: RedisService
  ) { }

  async findOne(userArgs: Prisma.UserWhereUniqueInput, sanitize: false): Promise<User>;
  async findOne(userArgs: Prisma.UserWhereUniqueInput, sanitize?: true): Promise<UserSanitized>;
  async findOne(userArgs: Prisma.UserWhereUniqueInput, sanitize = true): Promise<User | UserSanitized> {
    const expression = Object.keys(userArgs).map(key => {
      return { [key]: userArgs[key] }
    })
    if (expression.length === 0) throw new Error("bad argument")

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [...expression,],
      },
    })
    if (sanitize) return excludeUserSensetiveKeys(user)
    return user
  }

  async create(userArgs: Prisma.UserCreateInput): Promise<UserSanitized> {
    const user = await this.prisma.user.create({
      data: { ...userArgs },
    })
    if (!user) throw new Error("cannot create user")
    return excludeUserSensetiveKeys(user)
  }

  async updateOneById(id: string, userArgs: Prisma.UserUpdateInput): Promise<UserSanitized> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { ...userArgs }
    })
    return excludeUserSensetiveKeys(user)
  }

  async findSessionById(session: string) {
    const res = await this.redisService.get(`sess:${session}`)
    return res;
  }

  async setActiveSocket(userId: string, socketId: string) {
    await this.redisService.set(`active-socket:${userId}`, socketId)
  }

  async getActiveSocket(userId: string) {
    const activeSocket = await this.redisService.get(`active-socket:${userId}`)
    return activeSocket
  }

  async removeActiveSocket(userId: string) {
    await this.redisService.del(`active-socket:${userId}`)
  }
}
