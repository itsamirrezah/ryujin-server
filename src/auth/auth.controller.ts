import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  @Post('/')
  async signUp(@Body() body: SignUpDto) {
    return body
  }
}
