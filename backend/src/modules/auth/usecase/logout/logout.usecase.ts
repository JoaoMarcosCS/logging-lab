import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import type { AuthenticatedUser } from '../../decorators/current-user.decorator.js';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(LogoutUseCase.name);
  }

  async execute(user: AuthenticatedUser): Promise<void> {
    await this.sessionRepository.revoke(user.id, user.sessionId);

    // userId e sessionId não são repetidos: o AuthGuard já os colocou no contexto da requisição.
    // Repetir gera a chave duas vezes na mesma linha JSON, que o Elasticsearch recusa
    // (Duplicate field) quando recebe o documento sem passar por um coletor que a desfaça.
    this.logger.info({ event: 'auth.logout' }, 'logout');
  }
}
