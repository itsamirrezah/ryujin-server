import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, HttpCode, InternalServerErrorException, NotFoundException, Post, Query, Redirect, Session, UnauthorizedException, UseGuards } from '@nestjs/common';
import { IncorrectCredentials, UserAlreadyExistError, UserConflictError, UserNotFoundError } from 'src/common/errors';
import { AuthGuard } from './auth.guard';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthService } from './service/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('/')
  @UseGuards(AuthGuard)
  async current(@Session() session: any) {
    return session.user
  }

  @HttpCode(201)
  @Post('/')
  async signUp(@Body() body: SignUpDto, @Session() session: any) {
    const { email, username, password } = body
    try {
      const user = await this.authService.signUp(email, username, password)
      this.authService.sendEmailVerificationLink(user.id, user.email)
      session.user = user
      return user
    } catch (e: unknown) {
      if (e instanceof UserConflictError) throw new ConflictException(e.message)
      throw new InternalServerErrorException("An unexpected error occurred")
    }
  }

  @Post('/sign-in')
  async signIn(@Body() body: SignInDto, @Session() session: any) {
    try {
      const user = await this.authService.signin(body.usernameOrEmail, body.password)
      session.user = user
      return user;
    } catch (e: unknown) {
      if (e instanceof UserNotFoundError) throw new NotFoundException(e.message)
      if (e instanceof UserAlreadyExistError) throw new ForbiddenException(e.message)
      if (e instanceof IncorrectCredentials) throw new UnauthorizedException(e.message)
      throw new InternalServerErrorException("An unexpected error occurred")
    }
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
