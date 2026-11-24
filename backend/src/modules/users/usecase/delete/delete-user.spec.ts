import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { DeleteUserUseCase } from './delete-user.usecase.js';
import type { IUserRepository } from '../../repository/user-interface.repository.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import {
  mockLogger,
  mockSessionRepository,
  mockUserRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';

describe('DeleteUserUseCase', () => {
  let userRepository: Mocked<IUserRepository>;
  let sessionRepository: Mocked<ISessionRepository>;
  let logger: MockedLogger;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    userRepository = mockUserRepository();
    sessionRepository = mockSessionRepository();
    logger = mockLogger();
    useCase = new DeleteUserUseCase(
      userRepository,
      sessionRepository,
      logger as unknown as PinoLogger,
    );
  });

  it('marks the user as inactive and revokes every session', async () => {
    userRepository.update.mockResolvedValue({
      id: USER_ID,
      name: 'Maria',
      email: 'maria@email.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await useCase.execute(USER_ID);

    expect(userRepository.update).toHaveBeenCalledWith(USER_ID, {
      status: EStatusUser.INACTIVE,
    });
    expect(sessionRepository.revokeAll).toHaveBeenCalledWith(USER_ID);
  });

  it('throws NotFoundException when the user does not exist', async () => {
    userRepository.update.mockResolvedValue(null);

    await expect(useCase.execute(USER_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(sessionRepository.revokeAll).not.toHaveBeenCalled();
  });
});
