import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import { SessionData } from 'express-session';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === "http") {
      const request = context.switchToHttp().getRequest() as Request;
      const { user: sessionUser } = request.session
      if (!sessionUser?.id || !request.sessionID) {
        return false;
      }

      const serverSession = await this.usersService.findSessionById(request.sessionID)
      if (!serverSession) {
        return false;
      }

      if (!!sessionUser.emailConfirmed && !!sessionUser.username) {
        return true;
      }
      const user = await this.usersService.findOne({ id: sessionUser.id })
      if (!user) {
        return false;
      }
      request.session.user = user
      return true;

    } else if (context.getType() === "ws") {
      const client = context.switchToWs().getClient()
      const session = client.request['session'] as SessionData
      const sessionId = client.request.sessionID
      const serverSession = await this.usersService.findSessionById(sessionId)

      if (!session || !session.user || !serverSession) {
        client.disconnect(true)
        return false;
      }
      return true;
    }
  }
}
