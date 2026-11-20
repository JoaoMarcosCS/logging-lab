import { SessionRepository } from '../../../../modules/sessions/repository/session.repository.js';
import { cacheProvider } from '../../cache.setup.js';

const MARIA = '01970000-0000-7000-8000-000000000001';
const JOAO = '01970000-0000-7000-8000-000000000002';

const session = (userId: string, sessionId: string) => ({
  userId,
  sessionId,
  refreshTokenId: `${sessionId}-jti`,
});

const makeRepository = () => new SessionRepository(cacheProvider());

describe('SessionRepository (integração)', () => {
  it('saves and finds a session', async () => {
    const repository = makeRepository();
    await repository.save(session(MARIA, 's1'), 60);

    await expect(repository.find(MARIA, 's1')).resolves.toEqual(
      session(MARIA, 's1'),
    );
    await expect(repository.find(JOAO, 's1')).resolves.toBeNull();
  });

  it('overwrites the session when saved again', async () => {
    const repository = makeRepository();
    await repository.save(session(MARIA, 's1'), 60);

    await repository.save(
      { ...session(MARIA, 's1'), refreshTokenId: 'new' },
      60,
    );

    await expect(repository.find(MARIA, 's1')).resolves.toMatchObject({
      refreshTokenId: 'new',
    });
  });

  it('expires the session after the ttl', async () => {
    const repository = makeRepository();
    await repository.save(session(MARIA, 's1'), 1);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    await expect(repository.find(MARIA, 's1')).resolves.toBeNull();
  });

  it('revokes only the given session', async () => {
    const repository = makeRepository();
    await repository.save(session(MARIA, 's1'), 60);
    await repository.save(session(MARIA, 's2'), 60);

    await repository.revoke(MARIA, 's1');

    await expect(repository.find(MARIA, 's1')).resolves.toBeNull();
    await expect(repository.find(MARIA, 's2')).resolves.not.toBeNull();
  });

  it('revokes every session of the user and keeps the others', async () => {
    const repository = makeRepository();
    await repository.save(session(MARIA, 's1'), 60);
    await repository.save(session(MARIA, 's2'), 60);
    await repository.save(session(JOAO, 's3'), 60);

    await repository.revokeAll(MARIA);

    await expect(repository.find(MARIA, 's1')).resolves.toBeNull();
    await expect(repository.find(MARIA, 's2')).resolves.toBeNull();
    await expect(repository.find(JOAO, 's3')).resolves.not.toBeNull();
  });
});
