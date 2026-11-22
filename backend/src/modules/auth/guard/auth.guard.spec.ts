import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';
import type { TokenService } from '../token/token.service.js';
import type { ISessionRepository } from '../../sessions/repository/session-interface.repository.js';
import type { PinoLogger } from 'nestjs-pino';
import {
  mockLogger,
  mockSessionRepository,
  USER_ID,
} from '../../../tests/mocks/index.js';
import type {
  Mocked,
  MockedLogger,
  MockedTokenService,
} from '../../../tests/mocks/index.js';

const makeContext = (request: Record<string, any>) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let tokenService: MockedTokenService;
  let sessionRepository: Mocked<ISessionRepository>;
  let logger: MockedLogger;
  let guard: AuthGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    tokenService = {
      createTokens: vi.fn(),
      verifyAccessToken: vi
        .fn()
        .mockResolvedValue({ sub: USER_ID, sid: 'session-1' }),
      verifyRefreshToken: vi.fn(),
    };
    sessionRepository = mockSessionRepository();
    logger = mockLogger();
    guard = new AuthGuard(
      reflector as unknown as Reflector,
      tokenService as unknown as TokenService,
      sessionRepository,
      logger as unknown as PinoLogger,
    );
  });

  it('allows public routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(makeContext({ headers: {} }))).resolves.toBe(
      true,
    );
    expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('attaches the user when the cookie token and the session are valid', async () => {
    sessionRepository.find.mockResolvedValue({
      userId: USER_ID,
      sessionId: 'session-1',
      refreshTokenId: 'jti',
    });
    const request: Record<string, any> = {
      headers: { cookie: 'theme=dark; access_token=token' },
    };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('token');
    expect(sessionRepository.find).toHaveBeenCalledWith(USER_ID, 'session-1');
    expect(request.user).toEqual({ id: USER_ID, sessionId: 'session-1' });
    expect(logger.assign).toHaveBeenCalledWith({
      userId: USER_ID,
      sessionId: 'session-1',
    });
  });

  it('rejects when the cookie is missing', async () => {
    await expect(
      guard.canActivate(makeContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when the token is invalid', async () => {
    tokenService.verifyAccessToken.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        makeContext({ headers: { cookie: 'access_token=token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessionRepository.find).not.toHaveBeenCalled();
  });

  it('rejects when the session was revoked', async () => {
    sessionRepository.find.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        makeContext({ headers: { cookie: 'access_token=token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
