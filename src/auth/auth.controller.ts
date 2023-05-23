import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Request } from 'express';
import { LocalAuth } from './passport/local.guard';
import { GoogleGuard } from './passport/google.guard';
import { SessionAuthGuard } from './session-auth.guard';

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

  @UseGuards(GoogleGuard)
  @Get('/google')
  async signInWithGoogle() {
    return 'Google!'
  }

  @Get('/google/redirect')
  @UseGuards(GoogleGuard)
  async signInWithGoogleCallback(@Req() req: Request) {
    return req.user
  }

  @Get('protected')
  @UseGuards(SessionAuthGuard)
  async protected(@Req() req: Request) {
    return req.user
  }
}
