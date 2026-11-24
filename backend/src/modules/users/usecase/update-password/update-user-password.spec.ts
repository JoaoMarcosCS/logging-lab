import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { UpdateUserPasswordUseCase } from './update-user-password.usecase.js';
import type { IUserRepository } from '../../repository/user-interface.repository.js';
import type { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import {
  mockLogger,
  mockSessionRepository,
  mockUserRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import { hash } from '../../../../shared/utils/hash.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';

describe('UpdateUserPasswordUseCase', () => {
  let userRepository: Mocked<IUserRepository>;
  let sessionRepository: Mocked<ISessionRepository>;
  let logger: MockedLogger;
  let useCase: UpdateUserPasswordUseCase;

  beforeEach(async () => {
    userRepository = mockUserRepository();
    sessionRepository = mockSessionRepository();
    logger = mockLogger();
    useCase = new UpdateUserPasswordUseCase(
      userRepository,
      sessionRepository,
      logger as unknown as PinoLogger,
    );
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
    expect(logger.info).toHaveBeenCalledWith(
      { event: 'user.password_changed' },
      'password changed, all sessions revoked',
    );
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
    expect(logger.warn).toHaveBeenCalledWith(
      {
        event: 'user.password_change.failed',
        reason: 'invalid_current_password',
      },
      'password change failed',
    );
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
