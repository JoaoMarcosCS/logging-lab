import { Injectable, UnauthorizedException } from '@nestjs/common';
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
  ) {}

  async execute(refreshToken: string | undefined): Promise<AuthTokens> {
    const payload = refreshToken
      ? await this.tokenService.verifyRefreshToken(refreshToken)
      : null;

    if (!payload) {
      throw new UnauthorizedException(MessageError.UNAUTHENTICATED);
    }

    const session = await this.sessionRepository.find(payload.sub, payload.sid);

    if (!session) {
      throw new UnauthorizedException(MessageError.UNAUTHENTICATED);
    }

    if (session.refreshTokenId !== payload.jti) {
      await this.sessionRepository.revoke(payload.sub, payload.sid);
      throw new UnauthorizedException(MessageError.UNAUTHENTICATED);
    }

    const rotated = { ...session, refreshTokenId: uuidv7() };

    await this.sessionRepository.save(rotated, env.JWT_REFRESH_TTL);

    return await this.tokenService.createTokens(rotated);
  }
}
