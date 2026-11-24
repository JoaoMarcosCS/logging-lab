import { ConflictException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { IUserRepository } from '../../repository/user-interface.repository.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import type { CreateUserData } from './create-user.schema.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { hash } from '../../../../shared/utils/hash.js';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(CreateUserUseCase.name);
  }

  async execute(data: CreateUserData): Promise<PublicUser> {
    const usersWithEmail = await this.userRepository.findBy({
      columns: { email: data.email },
      limit: 1,
    });

    // O 409 revela que o email já tem conta. Muitos desses eventos vindos do mesmo IP
    // indicam alguém descobrindo quais emails estão cadastrados (enumeração).
    // O email não é registrado: é dado pessoal.
    if (usersWithEmail.length > 0) {
      this.logger.warn(
        { event: 'user.create.failed', reason: 'email_already_exists' },
        'user creation failed',
      );
      throw new ConflictException(MessageError.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await hash.generate(data.password);

    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    // Rota pública: não há usuário autenticado no contexto, então o userId vai explícito.
    this.logger.info(
      { event: 'user.created', userId: user.id },
      'user created',
    );

    return user;
  }
}
