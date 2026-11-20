import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import type { UpdateUserPasswordData } from './update-user-password.schema.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { hash } from '../../../../shared/utils/hash.js';

@Injectable()
export class UpdateUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(id: string, data: UpdateUserPasswordData): Promise<void> {
    const user = await this.userRepository.findWithPasswordBy({ id });

    if (!user) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    const matches = await hash.compare(data.currentPassword, user.password);

    if (!matches) {
      throw new BadRequestException(MessageError.INVALID_CURRENT_PASSWORD);
    }

    await this.userRepository.update(id, {
      password: await hash.generate(data.newPassword),
    });
    await this.sessionRepository.revokeAll(id);
  }
}
