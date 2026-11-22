import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { getRequestCookie } from '@nestjs/core/helpers/cookies/request-cookies.js';
import { TokenService } from '../token/token.service.js';
import { ISessionRepository } from '../../sessions/repository/session-interface.repository.js';
import { IS_PUBLIC_KEY } from '../../../shared/decorators/public.decorator.js';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator.js';
import { ACCESS_TOKEN_COOKIE } from '../utils/auth-cookies.js';
import { MessageError } from '../../../shared/enums/errors.enum.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly sessionRepository: ISessionRepository,
    private readonly logger: PinoLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & Record<string, any>>();

    const token = getRequestCookie(request, ACCESS_TOKEN_COOKIE);

    const payload = token
      ? await this.tokenService.verifyAccessToken(token)
      : null;

    const session = payload
      ? await this.sessionRepository.find(payload.sub, payload.sid)
      : null;

    if (!payload || !session) {
      throw new UnauthorizedException(MessageError.UNAUTHENTICATED);
    }

    request.user = { id: payload.sub, sessionId: payload.sid };
    // Grava userId e sessionId no contexto da requisição (AsyncLocalStorage).
    // Todo log emitido daqui em diante nesta requisição, inclusive o access log,
    // sai com esses campos, mesmo em classes que não sabem quem é o usuário.
    this.logger.assign({ userId: payload.sub, sessionId: payload.sid });

    return true;
  }
}
