import { BadRequestException, Body, Controller, Get, Param, Post, Query, Redirect, Session, UseGuards } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthGuard } from './auth.guard';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('/')
  @UseGuards(AuthGuard)
  async current(@Session() session: any) {
    return session.user
  }

  @Post('/')
  async signUp(@Body() body: SignUpDto) {
    const user = await this.authService.signUp(body.email, body.username, body.password)
    await this.authService.sendVerificationEmail(user.id, user.email)
    return user
  }

  @Post('/sign-in')
  async signIn(@Body() body: SignInDto, @Session() session: any) {
    const user = await this.authService.signin(body.usernameOrEmail, body.password)
    session.user = user
    return user;
  }

  @Post('/google')
  async signInWithGoogleToken(@Body('access') access: string, @Session() session: any) {
    const user = await this.authService.signInWithGoogleToken(access)
    session.user = user
    return user
  }

  @Redirect(process.env.WEB_HOST)
  @Get('verify')
  async verifyEmail(@Query('token') token: string, @Session() session: any) {
    if (!token) return new BadRequestException('no token')
    try {
      const res = await this.authService.validateVerificationToken(token)
      const userId = res.user.id as string
      const user = await this.authService.confirmEmailUser(userId)
      session.user = user
    } catch (e) {
    }
  }
}
