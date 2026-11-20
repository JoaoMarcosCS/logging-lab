import { LogoutUseCase } from './logout.usecase.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import {
  mockSessionRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked } from '../../../../tests/mocks/index.js';

describe('LogoutUseCase', () => {
  let sessionRepository: Mocked<ISessionRepository>;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    sessionRepository = mockSessionRepository();
    useCase = new LogoutUseCase(sessionRepository);
  });

  it('revokes only the current session', async () => {
    await useCase.execute({ id: USER_ID, sessionId: 'session-1' });

    expect(sessionRepository.revoke).toHaveBeenCalledWith(USER_ID, 'session-1');
    expect(sessionRepository.revokeAll).not.toHaveBeenCalled();
  });
});
