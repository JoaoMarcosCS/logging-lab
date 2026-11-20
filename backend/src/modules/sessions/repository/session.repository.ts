import { Injectable } from '@nestjs/common';
import { ICacheProvider } from '../../../infra/cache/cache-interface.provider.js';
import type {
  ISessionRepository,
  Session,
} from './session-interface.repository.js';

const sessionsOfUser = (userId: string) => `session:${userId}:`;

const sessionKey = (userId: string, sessionId: string) =>
  `${sessionsOfUser(userId)}${sessionId}`;

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(private readonly cacheProvider: ICacheProvider) {}

  async save(session: Session, ttlSeconds: number): Promise<void> {
    await this.cacheProvider.set(
      sessionKey(session.userId, session.sessionId),
      session,
      ttlSeconds,
    );
  }

  async find(userId: string, sessionId: string): Promise<Session | null> {
    return await this.cacheProvider.get<Session>(sessionKey(userId, sessionId));
  }

  async revoke(userId: string, sessionId: string): Promise<void> {
    await this.cacheProvider.invalidate(sessionKey(userId, sessionId));
  }

  async revokeAll(userId: string): Promise<void> {
    await this.cacheProvider.invalidateByPrefix(sessionsOfUser(userId));
  }
}
