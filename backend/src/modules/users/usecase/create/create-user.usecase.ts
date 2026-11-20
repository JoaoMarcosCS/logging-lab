import { ConflictException, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import type { CreateUserData } from './create-user.schema.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { hash } from '../../../../shared/utils/hash.js';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: CreateUserData): Promise<PublicUser> {
    const usersWithEmail = await this.userRepository.findBy({
      columns: { email: data.email },
      limit: 1,
    });

    if (usersWithEmail.length > 0) {
      throw new ConflictException(MessageError.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await hash.generate(data.password);

    return await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });
  }
}
