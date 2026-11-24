import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { UpdateUserUseCase } from './update-user.usecase.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import {
  mockLogger,
  mockUserRepository,
  OTHER_USER_ID,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import type { IUserRepository } from '../../repository/user-interface.repository.js';

const user: PublicUser = {
  id: USER_ID,
  name: 'Maria Silva',
  email: 'maria@email.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UpdateUserUseCase', () => {
  let repository: Mocked<IUserRepository>;
  let logger: MockedLogger;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    repository = mockUserRepository();
    logger = mockLogger();
    useCase = new UpdateUserUseCase(
      repository,
      logger as unknown as PinoLogger,
    );
  });

  it('updates the name without checking the email', async () => {
    repository.update.mockResolvedValue({ ...user, name: 'Maria' });

    await expect(useCase.execute(USER_ID, { name: 'Maria' })).resolves.toEqual({
      ...user,
      name: 'Maria',
    });
    expect(repository.findBy).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(USER_ID, { name: 'Maria' });
  });

  it('allows keeping the same email', async () => {
    repository.findBy.mockResolvedValue([user]);
    repository.update.mockResolvedValue(user);

    await expect(
      useCase.execute(USER_ID, { email: user.email }),
    ).resolves.toEqual(user);
  });

  it('throws ConflictException when the email belongs to another user', async () => {
    repository.findBy.mockResolvedValue([{ ...user, id: OTHER_USER_ID }]);

    await expect(
      useCase.execute(USER_ID, { email: user.email }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the user does not exist', async () => {
    repository.update.mockResolvedValue(null);

    await expect(
      useCase.execute(USER_ID, { name: 'Maria' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
