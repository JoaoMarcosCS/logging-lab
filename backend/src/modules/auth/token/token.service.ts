import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Session } from '../../sessions/repository/session-interface.repository.js';
import type { AuthTokens } from '../utils/auth-cookies.js';
import { env } from '../../../shared/environment/env.js';

export type AccessTokenPayload = {
  sub: string;
  sid: string;
};

export type RefreshTokenPayload = AccessTokenPayload & {
  jti: string;
};

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async createTokens(session: Session): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sid: session.sessionId },
        {
          subject: session.userId,
          secret: env.JWT_ACCESS_SECRET,
          expiresIn: env.JWT_ACCESS_TTL,
        },
      ),
      this.jwtService.signAsync(
        { sid: session.sessionId },
        {
          subject: session.userId,
          jwtid: session.refreshTokenId,
          secret: env.JWT_REFRESH_SECRET,
          expiresIn: env.JWT_REFRESH_TTL,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    const payload = await this.verify(token, env.JWT_ACCESS_SECRET);

    if (!payload?.sub || !payload.sid) {
      return null;
    }

    return { sub: payload.sub, sid: payload.sid };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    const payload = await this.verify(token, env.JWT_REFRESH_SECRET);

    if (!payload?.sub || !payload.sid || !payload.jti) {
      return null;
    }

    return { sub: payload.sub, sid: payload.sid, jti: payload.jti };
  }

  private async verify(
    token: string,
    secret: string,
  ): Promise<Partial<RefreshTokenPayload> | null> {
    try {
      return await this.jwtService.verifyAsync<Partial<RefreshTokenPayload>>(
        token,
        { secret, algorithms: ['HS256'] },
      );
    } catch {
      return null;
    }
  }
}
