import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<PublicUser> {
    const users = await this.userRepository.findBy({
      columns: { id },
    });

    const user = users[0];

    if (!user) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    return user;
  }
}
