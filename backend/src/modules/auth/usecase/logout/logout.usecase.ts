import { Injectable } from '@nestjs/common';
import { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import type { AuthenticatedUser } from '../../decorators/current-user.decorator.js';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(user: AuthenticatedUser): Promise<void> {
    await this.sessionRepository.revoke(user.id, user.sessionId);
  }
}
