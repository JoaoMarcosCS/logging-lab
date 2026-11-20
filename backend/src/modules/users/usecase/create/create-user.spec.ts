import type { Mock } from 'vitest';
import { ConflictException } from '@nestjs/common';
import type { IUserRepository } from '../../repository/user-interface.repository.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import { CreateUserUseCase } from './create-user.usecase.js';
import { hash } from '../../../../shared/utils/hash.js';

const user: PublicUser = {
  id: '01970000-0000-7000-8000-000000000001',
  name: 'Maria Silva',
  email: 'maria@email.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CreateUserUseCase', () => {
  let repository: { [K in keyof IUserRepository]: Mock<IUserRepository[K]> };
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findBy: vi.fn(),
      findWithPasswordBy: vi.fn(),
      update: vi.fn(),
    };
    useCase = new CreateUserUseCase(repository);
  });

  it('creates a user with a hashed password', async () => {
    repository.findBy.mockResolvedValue([]);
    repository.create.mockResolvedValue(user);

    const result = await useCase.execute({
      name: user.name,
      email: user.email,
      password: 'Secret@123',
    });

    expect(result).toEqual(user);
    expect(repository.findBy).toHaveBeenCalledWith({
      columns: { email: user.email },
      limit: 1,
    });
    expect(repository.findWithPasswordBy).not.toHaveBeenCalled();

    const saved = repository.create.mock.calls[0][0];
    expect(saved.password).not.toBe('Secret@123');
    await expect(hash.compare('Secret@123', saved.password)).resolves.toBe(
      true,
    );
  });

  it('throws ConflictException when the email is already registered', async () => {
    repository.findBy.mockResolvedValue([user]);

    await expect(
      useCase.execute({
        name: user.name,
        email: user.email,
        password: 'Secret@123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
