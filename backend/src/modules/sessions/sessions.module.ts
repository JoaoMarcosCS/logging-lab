import { Module } from '@nestjs/common';
import { ISessionRepository } from './repository/session-interface.repository.js';
import { SessionRepository } from './repository/session.repository.js';

@Module({
  providers: [{ provide: ISessionRepository, useClass: SessionRepository }],
  exports: [ISessionRepository],
})
export class SessionsModule {}
