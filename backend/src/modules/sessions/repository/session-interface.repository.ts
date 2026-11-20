export type Session = {
  userId: string;
  sessionId: string;
  refreshTokenId: string;
};

export abstract class ISessionRepository {
  abstract save(session: Session, ttlSeconds: number): Promise<void>;
  abstract find(userId: string, sessionId: string): Promise<Session | null>;
  abstract revoke(userId: string, sessionId: string): Promise<void>;
  abstract revokeAll(userId: string): Promise<void>;
}
