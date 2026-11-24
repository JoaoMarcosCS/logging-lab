import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import type { UpdateUserData } from './update-user.schema.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(UpdateUserUseCase.name);
  }

  async execute(id: string, data: UpdateUserData): Promise<PublicUser> {
    if (data.email) {
      const [userWithEmail] = await this.userRepository.findBy({
        columns: { email: data.email },
        limit: 1,
      });

      // Mesmo motivo do cadastro: o 409 revela que o email existe. O email não vai para o log.
      if (userWithEmail && userWithEmail.id !== id) {
        this.logger.warn(
          { event: 'user.update.failed', reason: 'email_already_exists' },
          'user update failed',
        );
        throw new ConflictException(MessageError.EMAIL_ALREADY_EXISTS);
      }
    }

    const user = await this.userRepository.update(id, data);

    if (!user) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    // Só os nomes dos campos alterados (name, email). Os valores são dados pessoais.
    // Uma troca de email é relevante para segurança: é um passo comum para tomar uma conta.
    this.logger.info(
      { event: 'user.updated', changedFields: Object.keys(data) },
      'user updated',
    );

    return user;
  }
}
