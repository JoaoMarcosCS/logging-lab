import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
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
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(UpdateUserPasswordUseCase.name);
  }

  async execute(id: string, data: UpdateUserPasswordData): Promise<void> {
    const user = await this.userRepository.findWithPasswordBy({ id });

    if (!user) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    const matches = await hash.compare(data.currentPassword, user.password);

    // Quem tem a sessão mas erra a senha atual pode ser alguém usando um token roubado
    // e tentando tomar a conta. Vale alerta quando se repete.
    if (!matches) {
      this.logger.warn(
        {
          event: 'user.password_change.failed',
          reason: 'invalid_current_password',
        },
        'password change failed',
      );
      throw new BadRequestException(MessageError.INVALID_CURRENT_PASSWORD);
    }

    await this.userRepository.update(id, {
      password: await hash.generate(data.newPassword),
    });
    await this.sessionRepository.revokeAll(id);

    // Evento de segurança: a senha mudou e todas as sessões foram encerradas.
    this.logger.info(
      { event: 'user.password_changed' },
      'password changed, all sessions revoked',
    );
  }
}
