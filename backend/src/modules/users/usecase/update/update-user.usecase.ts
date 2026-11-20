import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import type { UpdateUserData } from './update-user.schema.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, data: UpdateUserData): Promise<PublicUser> {
    if (data.email) {
      const [userWithEmail] = await this.userRepository.findBy({
        columns: { email: data.email },
        limit: 1,
      });

      if (userWithEmail && userWithEmail.id !== id) {
        throw new ConflictException(MessageError.EMAIL_ALREADY_EXISTS);
      }
    }

    const user = await this.userRepository.update(id, data);

    if (!user) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    return user;
  }
}
