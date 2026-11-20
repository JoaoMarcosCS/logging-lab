import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateUserPasswordUseCase } from './update-user-password.usecase.js';
import type { IUserRepository } from '../../repository/user-interface.repository.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import {
  mockSessionRepository,
  mockUserRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked } from '../../../../tests/mocks/index.js';
import { hash } from '../../../../shared/utils/hash.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';

describe('UpdateUserPasswordUseCase', () => {
  let userRepository: Mocked<IUserRepository>;
  let sessionRepository: Mocked<ISessionRepository>;
  let useCase: UpdateUserPasswordUseCase;

  beforeEach(async () => {
    userRepository = mockUserRepository();
    sessionRepository = mockSessionRepository();
    useCase = new UpdateUserPasswordUseCase(userRepository, sessionRepository);
    userRepository.findWithPasswordBy.mockResolvedValue({
      id: USER_ID,
      email: 'maria@email.com',
      password: await hash.generate('Current@123'),
      status: EStatusUser.ACTIVE,
    });
  });

  it('stores the new hashed password and revokes every session', async () => {
    await useCase.execute(USER_ID, {
      currentPassword: 'Current@123',
      newPassword: 'NewSecret@123',
    });

    const [id, data] = userRepository.update.mock.calls[0];
    expect(id).toBe(USER_ID);
    await expect(hash.compare('NewSecret@123', data.password!)).resolves.toBe(
      true,
    );
    expect(sessionRepository.revokeAll).toHaveBeenCalledWith(USER_ID);
  });

  it('throws BadRequestException when the current password is wrong', async () => {
    await expect(
      useCase.execute(USER_ID, {
        currentPassword: 'Wrong@123',
        newPassword: 'NewSecret@123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(sessionRepository.revokeAll).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the user does not exist', async () => {
    userRepository.findWithPasswordBy.mockResolvedValue(null);

    await expect(
      useCase.execute(USER_ID, {
        currentPassword: 'Current@123',
        newPassword: 'NewSecret@123',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
