import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.usecase.js';
import type { TokenService } from '../../token/token.service.js';
import type { IUserRepository } from '../../../users/repository/user-interface.repository.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import {
  mockSessionRepository,
  mockUserRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type {
  Mocked,
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
  let useCase: LoginUseCase;

  beforeEach(async () => {
    userRepository = mockUserRepository();
    sessionRepository = mockSessionRepository();
    tokenService = {
      createTokens: vi.fn().mockResolvedValue(tokens),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };
    useCase = new LoginUseCase(
      userRepository,
      sessionRepository,
      tokenService as unknown as TokenService,
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
  });
});
