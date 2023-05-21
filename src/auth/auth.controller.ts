import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Request } from 'express';
import { LocalAuth } from './passport/local.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/')
  async signUp(@Body() body: SignUpDto) {
    const user = await this.authService.signUp(body.email, body.username, body.password)
    return user
  }

  @UseGuards(LocalAuth)
  @Post('/sign-in')
  async signIn(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException()
    return req.user
  }
}
