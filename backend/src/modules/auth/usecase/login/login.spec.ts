import { UnauthorizedException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { LoginUseCase } from './login.usecase.js';
import type { TokenService } from '../../token/token.service.js';
import type { IUserRepository } from '../../../users/repository/user-interface.repository.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import {
  mockLogger,
  mockSessionRepository,
  mockUserRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type {
  Mocked,
  MockedLogger,
  MockedTokenService,
} from '../../../../tests/mocks/index.js';
import { hash } from '../../../../shared/utils/hash.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { env } from '../../../../shared/environment/env.js';

const tokens = { accessToken: 'access', refreshToken: 'refresh' };

describe('LoginUseCase', () => {
  let userRepository: Mocked<IUserRepository>;
  let sessionRepository: Mocked<ISessionRepository>;
  let tokenService: MockedTokenService;
  let logger: MockedLogger;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    userRepository = mockUserRepository();
    sessionRepository = mockSessionRepository();
    tokenService = {
      createTokens: vi.fn().mockResolvedValue(tokens),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };
    logger = mockLogger();
    useCase = new LoginUseCase(
      userRepository,
      sessionRepository,
      tokenService as unknown as TokenService,
      logger as unknown as PinoLogger,
    );
    userRepository.findWithPasswordBy.mockResolvedValue({
      id: USER_ID,
      email: 'maria@email.com',
      password: await hash.generate('Secret@123'),
      status: EStatusUser.ACTIVE,
    });
  });

  it('creates a session and returns the issued tokens', async () => {
    await expect(
      useCase.execute({ email: 'maria@email.com', password: 'Secret@123' }),
    ).resolves.toEqual(tokens);

    const [session, ttl] = sessionRepository.save.mock.calls[0];
    expect(session.userId).toBe(USER_ID);
    expect(session.sessionId).not.toBe(session.refreshTokenId);
    expect(ttl).toBe(env.JWT_REFRESH_TTL);
    expect(tokenService.createTokens).toHaveBeenCalledWith(session);
    expect(logger.info).toHaveBeenCalledWith(
      {
        event: 'auth.login.succeeded',
        userId: USER_ID,
        sessionId: session.sessionId,
      },
      'login succeeded',
    );
  });

  it.each([
    ['the email does not exist', null],
    ['the user is inactive', { status: EStatusUser.INACTIVE, password: 'any' }],
  ])('throws a generic 401 when %s', async (_, user) => {
    if (user) {
      userRepository.findWithPasswordBy.mockResolvedValue({
        id: USER_ID,
        email: 'maria@email.com',
        ...user,
      });
    } else {
      userRepository.findWithPasswordBy.mockResolvedValue(null);
    }

    const promise = useCase.execute({
      email: 'maria@email.com',
      password: 'Secret@123',
    });

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_CREDENTIALS);
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('throws a generic 401 when the password is wrong', async () => {
    await expect(
      useCase.execute({ email: 'maria@email.com', password: 'Wrong@123' }),
    ).rejects.toThrow(MessageError.INVALID_CREDENTIALS);
    expect(sessionRepository.save).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      {
        event: 'auth.login.failed',
        reason: 'invalid_password',
        userId: USER_ID,
      },
      'login failed',
    );
  });

  it('never writes the password or the tokens to the log', async () => {
    await useCase.execute({ email: 'maria@email.com', password: 'Secret@123' });
    await useCase
      .execute({ email: 'maria@email.com', password: 'Wrong@123' })
      .catch(() => undefined);

    const logged = JSON.stringify([
      ...logger.info.mock.calls,
      ...logger.warn.mock.calls,
    ]);
    expect(logged).not.toContain('Secret@123');
    expect(logged).not.toContain('Wrong@123');
    expect(logged).not.toContain(tokens.accessToken);
    expect(logged).not.toContain(tokens.refreshToken);
  });
});
