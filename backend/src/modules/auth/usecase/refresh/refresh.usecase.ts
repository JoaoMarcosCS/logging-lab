import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { v7 as uuidv7 } from 'uuid';
import { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import { TokenService } from '../../token/token.service.js';
import type { AuthTokens } from '../../utils/auth-cookies.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { env } from '../../../../shared/environment/env.js';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: TokenService,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(RefreshUseCase.name);
  }

  async execute(refreshToken: string | undefined): Promise<AuthTokens> {
    const payload = refreshToken
      ? await this.tokenService.verifyRefreshToken(refreshToken)
      : null;

    if (!payload) {
      this.logger.warn(
        { event: 'auth.refresh.failed', reason: 'invalid_token' },
        'refresh failed',
      );
      throw new UnauthorizedException(MessageError.UNAUTHENTICATED);
    }

    const session = await this.sessionRepository.find(payload.sub, payload.sid);

    if (!session) {
      this.logger.warn(
        {
          event: 'auth.refresh.failed',
          reason: 'session_not_found',
          userId: payload.sub,
          sessionId: payload.sid,
        },
        'refresh failed',
      );
      throw new UnauthorizedException(MessageError.UNAUTHENTICATED);
    }

    if (session.refreshTokenId !== payload.jti) {
      // jti diferente do salvo indica refresh token antigo sendo reutilizado:
      // provável roubo de token. É o evento de segurança que vira alerta no Graylog.
      await this.sessionRepository.revoke(payload.sub, payload.sid);
      this.logger.warn(
        {
          event: 'auth.refresh.reuse_detected',
          userId: payload.sub,
          sessionId: payload.sid,
        },
        'refresh token reuse detected, session revoked',
      );
      throw new UnauthorizedException(MessageError.UNAUTHENTICATED);
    }

    const rotated = { ...session, refreshTokenId: uuidv7() };

    await this.sessionRepository.save(rotated, env.JWT_REFRESH_TTL);

    // Rota pública (sem AuthGuard), então userId e sessionId vão explícitos.
    // Com o evento de sucesso, dá para comparar a taxa de falhas de refresh com o total.
    this.logger.info(
      {
        event: 'auth.refresh.succeeded',
        userId: rotated.userId,
        sessionId: rotated.sessionId,
      },
      'refresh succeeded',
    );

    return await this.tokenService.createTokens(rotated);
  }
}
