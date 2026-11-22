import { UnauthorizedException } from '@nestjs/common';
import { RefreshUseCase } from './refresh.usecase.js';
import type { TokenService } from '../../token/token.service.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import type { PinoLogger } from 'nestjs-pino';
import {
  mockLogger,
  mockSessionRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type {
  Mocked,
  MockedLogger,
  MockedTokenService,
} from '../../../../tests/mocks/index.js';
import { env } from '../../../../shared/environment/env.js';

const tokens = { accessToken: 'access', refreshToken: 'refresh' };
const session = {
  userId: USER_ID,
  sessionId: 'session-1',
  refreshTokenId: 'jti-1',
};

describe('RefreshUseCase', () => {
  let sessionRepository: Mocked<ISessionRepository>;
  let tokenService: MockedTokenService;
  let logger: MockedLogger;
  let useCase: RefreshUseCase;

  beforeEach(() => {
    sessionRepository = mockSessionRepository();
    tokenService = {
      createTokens: vi.fn().mockResolvedValue(tokens),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn().mockResolvedValue({
        sub: USER_ID,
        sid: session.sessionId,
        jti: session.refreshTokenId,
      }),
    };
    logger = mockLogger();
    useCase = new RefreshUseCase(
      sessionRepository,
      tokenService as unknown as TokenService,
      logger as unknown as PinoLogger,
    );
  });

  it('rotates the refresh token id and renews the session ttl', async () => {
    sessionRepository.find.mockResolvedValue(session);

    await expect(useCase.execute('refresh-token')).resolves.toEqual(tokens);

    const [saved, ttl] = sessionRepository.save.mock.calls[0];
    expect(saved).toMatchObject({
      userId: USER_ID,
      sessionId: session.sessionId,
    });
    expect(saved.refreshTokenId).not.toBe(session.refreshTokenId);
    expect(ttl).toBe(env.JWT_REFRESH_TTL);
    expect(tokenService.createTokens).toHaveBeenCalledWith(saved);
  });

  it('revokes the session when an already rotated token is reused', async () => {
    sessionRepository.find.mockResolvedValue({
      ...session,
      refreshTokenId: 'jti-2',
    });

    await expect(useCase.execute('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessionRepository.revoke).toHaveBeenCalledWith(
      USER_ID,
      session.sessionId,
    );
    expect(sessionRepository.save).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.refresh.reuse_detected',
        userId: USER_ID,
        sessionId: session.sessionId,
      }),
      expect.any(String),
    );
  });

  it('throws 401 when the session no longer exists', async () => {
    sessionRepository.find.mockResolvedValue(null);

    await expect(useCase.execute('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('throws 401 when the token is missing or invalid', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue(null);

    await expect(useCase.execute(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(useCase.execute('invalid')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessionRepository.find).not.toHaveBeenCalled();
  });
});
