import { Injectable } from "@nestjs/common";
import axios from "axios";
import { IncorrectGoogleToken } from "src/common/errors";

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
  async verifyAccessToken(token: string): Promise<GoogleUser> {
    try {
      const res = await axios.get<GoogleUser>('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.data || !res.data.sub) throw new Error("unexpected google data")
      return res.data
    } catch (e) {
      throw new IncorrectGoogleToken("We encountered a problem while verifying your Google account. Please try again later or contact support if the issue persist.")
    }
  }
}
