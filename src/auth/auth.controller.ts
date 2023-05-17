import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/')
  async signUp(@Body() body: SignUpDto) {
    const user = await this.authService.signUp(body.email, body.username, body.password)
    return user
  }
}
