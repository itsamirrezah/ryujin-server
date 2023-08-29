import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
  Put,
  Session,
  UseGuards
} from "@nestjs/common";
import { SessionData } from "express-session";
import { AuthGuard } from "src/auth/auth.guard";
import { IdParam } from "./dto/id.param";
import { UsernameDto } from "./dto/username.dto";
import { UsersService } from "./users.service";

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('/check-username/:username')
  async validateUsername(@Param() param: UsernameDto) {
    const { username } = param
    const user = await this.usersService.findOne({ username })
    if (user) throw new ConflictException(`${username} is already taken`)
    return { username }
  }

  //FIXME: global authorization
  @Put(':id/username')
  @UseGuards(AuthGuard)
  async upadteOne(@Param() param: IdParam, @Body() body: UsernameDto, @Session() session: SessionData) {
    const { id } = param
    const { username } = body
    if (session?.user?.id !== id) throw new ForbiddenException()
    try {
      const user = await this.usersService.updateOneById(id, { username })
      session.user = user
      return user
    } catch (e) {
      throw new InternalServerErrorException("An unexpected error occurred")
    }
  }
}
