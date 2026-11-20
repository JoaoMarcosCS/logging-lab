import type { Mock } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../repository/user-interface.repository.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import { GetUserUseCase } from './get-user.usecase.js';

const user: PublicUser = {
  id: '01970000-0000-7000-8000-000000000001',
  name: 'Maria Silva',
  email: 'maria@email.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GetUserUseCase', () => {
  let repository: { [K in keyof IUserRepository]: Mock<IUserRepository[K]> };
  let useCase: GetUserUseCase;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findBy: vi.fn(),
      findWithPasswordBy: vi.fn(),
      update: vi.fn(),
    };
    useCase = new GetUserUseCase(repository);
  });

  it('returns the user', async () => {
    repository.findBy.mockResolvedValue([user]);

    await expect(useCase.execute(user.id)).resolves.toEqual(user);
    expect(repository.findBy).toHaveBeenCalledWith({
      columns: { id: user.id },
    });
  });

  it('throws NotFoundException when the user does not exist', async () => {
    repository.findBy.mockResolvedValue([]);

    await expect(useCase.execute(user.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
