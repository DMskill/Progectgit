import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    try {
      // пытаемся аутентифицировать, если есть токен
      const res = (await super.canActivate(context)) as boolean;
      return res;
    } catch {
      // без токена/с ошибкой — просто пропускаем как аноним
      return true;
    }
  }

  handleRequest(err: any, user: any) {
    // Не бросаем ошибку: либо пользователь, либо null
    return user ?? null;
  }
}
