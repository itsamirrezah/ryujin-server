import { Injectable, UnauthorizedException } from "@nestjs/common";
import axios from "axios";

type GoogleUser = {
  sub: string,
  name: string,
  given_name: string,
  picture: string,
  email: string,
  email_verified: string,
  locale: string,
}

@Injectable()
export class GoogleAuthService {
  async verifyByAccessToken(token: string): Promise<GoogleUser> {
    try {
      const res = await axios.get<GoogleUser>('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.data
    } catch (e) {
      throw new UnauthorizedException('Invalid token')
    }
  }

}
