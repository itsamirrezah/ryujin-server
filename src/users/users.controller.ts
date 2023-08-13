

import { BadRequestException, Body, ConflictException, Controller, Get, InternalServerErrorException, Param, Put, Session } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('/check-username/:username')
  async validateUsername(@Param('username') username: string) {
    const user = await this.usersService.findOne({ username })
    if (user) throw new ConflictException("username is already taken")
    return { message: "username is available", username }
  }

  @Put(':id')
  async upadteOne(@Param('id') id: string, @Body() data: { username: string }, @Session() session: any) {
    if (!id || !data.username) return new BadRequestException()
    const user = await this.usersService.updateOneById(id, { username: data.username })
    if (!user) return new InternalServerErrorException()
    session.user = user
    return user
  }
}
