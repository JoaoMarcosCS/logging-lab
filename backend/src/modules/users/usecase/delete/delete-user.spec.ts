import { NotFoundException } from '@nestjs/common';
import { DeleteUserUseCase } from './delete-user.usecase.js';
import type { IUserRepository } from '../../repository/user-interface.repository.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import {
  mockSessionRepository,
  mockUserRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked } from '../../../../tests/mocks/index.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';

describe('DeleteUserUseCase', () => {
  let userRepository: Mocked<IUserRepository>;
  let sessionRepository: Mocked<ISessionRepository>;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    userRepository = mockUserRepository();
    sessionRepository = mockSessionRepository();
    useCase = new DeleteUserUseCase(userRepository, sessionRepository);
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
