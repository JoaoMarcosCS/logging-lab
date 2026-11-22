import { LogoutUseCase } from './logout.usecase.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import type { PinoLogger } from 'nestjs-pino';
import {
  mockLogger,
  mockSessionRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';

describe('LogoutUseCase', () => {
  let sessionRepository: Mocked<ISessionRepository>;
  let logger: MockedLogger;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    sessionRepository = mockSessionRepository();
    logger = mockLogger();
    useCase = new LogoutUseCase(
      sessionRepository,
      logger as unknown as PinoLogger,
    );
  });

  it('revokes only the current session', async () => {
    await useCase.execute({ id: USER_ID, sessionId: 'session-1' });

    expect(sessionRepository.revoke).toHaveBeenCalledWith(USER_ID, 'session-1');
    expect(sessionRepository.revokeAll).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      { event: 'auth.logout', userId: USER_ID, sessionId: 'session-1' },
      'logout',
    );
  });
});
