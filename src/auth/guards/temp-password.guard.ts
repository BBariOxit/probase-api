import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_TEMP_PASSWORD_KEY } from '../decorators/allow-temp-password.decorator';

@Injectable()
export class TempPasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<boolean>(
      ALLOW_TEMP_PASSWORD_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowed) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { mustChangePassword?: boolean } }>();

    // No user on the request means the route is @Public() and JwtAuthGuard has
    // already let it through — there is no session here to restrict.
    if (!request.user?.mustChangePassword) return true;

    // A distinct `code` rather than only prose: the client has to tell this
    // apart from an ordinary permission failure in order to send the user to
    // the right screen, and matching on a message is a promise nobody keeps.
    throw new ForbiddenException({
      statusCode: 403,
      // `error` and `code` are for the client to branch on and stay in English;
      // only `message` is read by a person.
      error: 'Forbidden',
      message: 'Bạn cần đổi mật khẩu trước khi tiếp tục',
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
  }
}
