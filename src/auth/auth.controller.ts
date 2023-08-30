import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
  Redirect,
  Req,
  Session,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { Request } from 'express';
import { SessionData } from 'express-session';
import { TokenExpiredError } from 'jsonwebtoken';
import {
  IncorrectCredentials,
  IncorrectGoogleToken,
  UserAlreadyExistError,
  UserConflictError,
  UserNotFoundError
} from 'src/common/errors';
import { AuthGuard } from './auth.guard';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SignWithGoogleDto } from './dto/sign-with-google.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './service/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('/')
  @UseGuards(AuthGuard)
  async current(@Session() session: SessionData) {
    return session.user
  }

  @HttpCode(201)
  @Post('/')
  async signUp(@Body() body: SignUpDto, @Session() session: SessionData) {
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
  async signIn(@Body() body: SignInDto, @Session() session: SessionData) {
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
  async signWithGoogle(@Body() body: SignWithGoogleDto, @Session() session: SessionData) {
    try {
      const user = await this.authService.signWithGoogle(body.access)
      session.user = user
      return user
    } catch (e: unknown) {
      if (e instanceof IncorrectGoogleToken) throw new UnauthorizedException(e.message)
      throw new InternalServerErrorException("An unexpected error occurred")
    }
  }

  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Post('/logout')
  async onLogout(@Req() req: Request) {
    await new Promise<void>((res, rej) => {
      req.session.destroy(err => {
        if (err) rej(new InternalServerErrorException("logout failed"))
        else res()
      })
    })
  }

  @Redirect(process.env.WEB_HOST)
  @Get('verify')
  async verifyEmail(@Query() query: VerifyEmailDto, @Session() session: SessionData) {
    try {
      const user = await this.authService.verifyUserEmail(query.token)
      session.user = user
    } catch (e) {
      if (e instanceof TokenExpiredError) throw new UnauthorizedException("your verification link expired!")
      throw new InternalServerErrorException("An unexpected error occurred")
    }
  }
}
