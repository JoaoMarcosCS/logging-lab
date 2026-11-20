import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.update(id, {
      status: EStatusUser.INACTIVE,
    });

    if (!user) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    await this.sessionRepository.revokeAll(id);
  }
}
