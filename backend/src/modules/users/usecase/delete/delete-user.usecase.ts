import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(DeleteUserUseCase.name);
  }

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.update(id, {
      status: EStatusUser.INACTIVE,
    });

    if (!user) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    await this.sessionRepository.revokeAll(id);

    // A conta é desativada e todas as sessões caem. O userId vem do contexto (AuthGuard),
    // e é o mesmo id da conta apagada: a rota só apaga a conta de quem está logado.
    this.logger.info(
      { event: 'user.deleted' },
      'user deleted, all sessions revoked',
    );
  }
}
