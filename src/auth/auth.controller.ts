import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Request } from 'express';
import { LocalAuth } from './passport/local.guard';
import { SessionAuthGuard } from './session-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/')
  async signUp(@Body() body: SignUpDto, @Req() req: Request) {
    const user = await this.authService.signUp(body.email, body.username, body.password)
    await new Promise<void>((resolve, reject) => {
      req.logIn(user, (err) => {
        if (err) reject(err)
        resolve()
      })
    })
    return user
  }

  @UseGuards(LocalAuth)
  @Post('/sign-in')
  async signIn(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException()
    return req.user
  }

  @Post('/google')
  async signInWithGoogleToken(@Body('access') access: string) {
    const user = await this.authService.signInWithGoogleToken(access)
    return user
  }

  @Get('protected')
  @UseGuards(SessionAuthGuard)
  async protected(@Req() req: Request) {
    return req.user
  }
}
