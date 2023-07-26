import { Body, Controller, Get, Post, Req, Session, UseGuards } from '@nestjs/common';
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
  async signUp(@Body() body: SignUpDto, @Session() session: any) {
    const user = await this.authService.signUp(body.email, body.username, body.password)
    session.user = user
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

}
