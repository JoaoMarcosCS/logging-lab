import { Injectable, UnauthorizedException } from '@nestjs/common';
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
  ) {}

  async execute(data: LoginData): Promise<AuthTokens> {
    const user = await this.userRepository.findWithPasswordBy({
      email: data.email,
    });

    if (!user || !(await hash.compare(data.password, user.password))) {
      throw new UnauthorizedException(MessageError.INVALID_CREDENTIALS);
    }

    const session = {
      userId: user.id,
      sessionId: uuidv7(),
      refreshTokenId: uuidv7(),
    };

    await this.sessionRepository.save(session, env.JWT_REFRESH_TTL);

    return await this.tokenService.createTokens(session);
  }
}
