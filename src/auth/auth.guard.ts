import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;
    const { user: sessionUser } = request.session
    if (!sessionUser?.id) return false;
    if (!!sessionUser.emailConfirmed && !!sessionUser.username) {
      return true;
    }
    const user = await this.usersService.findOne({ id: sessionUser.id })
    if (!user) return false;
    request.session.user = user
    return true;
  }
}
