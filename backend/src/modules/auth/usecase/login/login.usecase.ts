import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { v7 as uuidv7 } from 'uuid';
import { IUserRepository } from '../../../users/repository/user-interface.repository.js';
import { ISessionRepository } from '../../../sessions/repository/session-interface.repository.js';
import { TokenService } from '../../token/token.service.js';
import type { LoginData } from './login.schema.js';
import type { AuthTokens } from '../../utils/auth-cookies.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { env } from '../../../../shared/environment/env.js';
import { hash } from '../../../../shared/utils/hash.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: TokenService,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(LoginUseCase.name);
  }

  async execute(data: LoginData): Promise<AuthTokens> {
    const user = await this.userRepository.findWithPasswordBy({
      email: data.email,
    });

    // A resposta HTTP é a mesma nos dois casos, para não revelar se o email existe.
    // O log separa os motivos para diferenciar enumeração de emails de senha esquecida.
    // O email digitado não é registrado: é dado pessoal, às vezes de quem nem é usuário.
    if (!user) {
      this.logger.warn(
        { event: 'auth.login.failed', reason: 'user_not_found' },
        'login failed',
      );
      throw new UnauthorizedException(MessageError.INVALID_CREDENTIALS);
    }

    if (!(await hash.compare(data.password, user.password))) {
      this.logger.warn(
        {
          event: 'auth.login.failed',
          reason: 'invalid_password',
          userId: user.id,
        },
        'login failed',
      );
      throw new UnauthorizedException(MessageError.INVALID_CREDENTIALS);
    }

    const session = {
      userId: user.id,
      sessionId: uuidv7(),
      refreshTokenId: uuidv7(),
    };

    await this.sessionRepository.save(session, env.JWT_REFRESH_TTL);

    this.logger.info(
      {
        event: 'auth.login.succeeded',
        userId: session.userId,
        sessionId: session.sessionId,
      },
      'login succeeded',
    );

    return await this.tokenService.createTokens(session);
  }
}
