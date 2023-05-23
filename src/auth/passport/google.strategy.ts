import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { AuthService } from "../service/auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      callbackURL: `${process.env.HOST}/auth/google/redirect`,
      scope: ['email', 'profile'],
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log({ accessToken, refreshToken, profile })
    const { id, displayName, emails, photos } = profile
    const user = await this.authService.validateGoogleUser(emails[0].value, id)
    if (!user) throw new UnauthorizedException('google user not found')
    return user;
  }
}
