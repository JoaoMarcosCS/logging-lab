import { ConflictException } from '@nestjs/common';
import { AppDataSource } from '../../../../infra/database/data-source.js';
import { UserEntity } from '../../../../modules/users/entity/user.entity.js';
import { UserRepository } from '../../../../modules/users/repository/user.repository.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { EStatusUser } from '../../../../shared/enums/users/user-status.enum.js';

const PUBLIC_KEYS = ['createdAt', 'email', 'id', 'name', 'updatedAt'];

const payload = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'hashed',
};

const makeRepository = () =>
  new UserRepository(AppDataSource.getRepository(UserEntity));

describe('UserRepository (integração)', () => {
  describe('create', () => {
    it('returns only public columns in camelCase', async () => {
      const repository = makeRepository();

      const user = await repository.create(payload);

      expect(Object.keys(user).sort()).toEqual(PUBLIC_KEYS);
      expect(user).toMatchObject({ name: payload.name, email: payload.email });
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('generates time-ordered UUIDv7 ids', async () => {
      const repository = makeRepository();

      const first = await repository.create(payload);
      const second = await repository.create({
        ...payload,
        email: 'jane.doe@example.com',
      });

      expect(first.id[14]).toBe('7');
      expect(second.id > first.id).toBe(true);
    });

    it('throws ConflictException when the email already exists', async () => {
      const repository = makeRepository();
      await repository.create(payload);

      const promise = repository.create({ ...payload, name: 'Other' });

      await expect(promise).rejects.toBeInstanceOf(ConflictException);
      await expect(promise).rejects.toThrow(MessageError.EMAIL_ALREADY_EXISTS);
    });
  });

  describe('findBy', () => {
    it('finds by id, email and name returning public columns', async () => {
      const repository = makeRepository();
      const created = await repository.create(payload);

      const [byId, byEmail, byName] = await Promise.all([
        repository.findBy({ columns: { id: created.id } }),
        repository.findBy({ columns: { email: payload.email } }),
        repository.findBy({ columns: { name: payload.name } }),
      ]);

      expect(byId).toEqual([created]);
      expect(byEmail).toEqual([created]);
      expect(byName).toEqual([created]);
      expect(Object.keys(byId[0]).sort()).toEqual(PUBLIC_KEYS);
    });

    it('combines filters with AND', async () => {
      const repository = makeRepository();
      await repository.create(payload);

      const users = await repository.findBy({
        columns: { email: payload.email, name: 'Other' },
      });

      expect(users).toEqual([]);
    });

    it('returns an empty list when nothing matches', async () => {
      const repository = makeRepository();
      await repository.create(payload);

      await expect(
        repository.findBy({ columns: { email: 'missing@example.com' } }),
      ).resolves.toEqual([]);
    });

    it('paginates from newest to oldest using limit and cursor', async () => {
      const repository = makeRepository();
      const first = await repository.create(payload);
      const second = await repository.create({
        ...payload,
        email: 'jane.doe@example.com',
      });
      const third = await repository.create({
        ...payload,
        email: 'ana@example.com',
      });

      const firstPage = await repository.findBy({
        columns: { name: payload.name },
        limit: 2,
      });
      const secondPage = await repository.findBy({
        columns: { name: payload.name },
        limit: 2,
        cursor: firstPage[1].id,
      });

      expect(firstPage.map(({ id }) => id)).toEqual([third.id, second.id]);
      expect(secondPage.map(({ id }) => id)).toEqual([first.id]);
    });

    it('returns only active users when no status is given', async () => {
      const repository = makeRepository();
      const active = await repository.create(payload);
      const inactive = await repository.create({
        ...payload,
        email: 'jane.doe@example.com',
      });
      await repository.update(inactive.id, { status: EStatusUser.INACTIVE });

      const [withoutStatus, withEmptyStatus] = await Promise.all([
        repository.findBy({ columns: { name: payload.name } }),
        repository.findBy({ columns: { name: payload.name, status: [] } }),
      ]);

      expect(withoutStatus.map(({ id }) => id)).toEqual([active.id]);
      expect(withEmptyStatus.map(({ id }) => id)).toEqual([active.id]);
    });

    it('filters by the given statuses', async () => {
      const repository = makeRepository();
      const active = await repository.create(payload);
      const inactive = await repository.create({
        ...payload,
        email: 'jane.doe@example.com',
      });
      await repository.update(inactive.id, { status: EStatusUser.INACTIVE });

      const [onlyInactive, both] = await Promise.all([
        repository.findBy({
          columns: { name: payload.name, status: [EStatusUser.INACTIVE] },
        }),
        repository.findBy({
          columns: {
            name: payload.name,
            status: [EStatusUser.ACTIVE, EStatusUser.INACTIVE],
          },
        }),
      ]);

      expect(onlyInactive.map(({ id }) => id)).toEqual([inactive.id]);
      expect(both.map(({ id }) => id)).toEqual([inactive.id, active.id]);
    });

    it.each([
      ['no filter', {}],
      ['only undefined filters', { email: undefined, id: undefined }],
    ])('throws when called with %s', async (_, columns) => {
      const repository = makeRepository();
      await repository.create(payload);

      await expect(repository.findBy({ columns })).rejects.toThrow(
        'Nenhum critério de busca fornecido',
      );
    });
  });

  describe('findWithPasswordBy', () => {
    it('finds by email or id returning id, email, password and status', async () => {
      const repository = makeRepository();
      const { id } = await repository.create(payload);
      const expected = {
        id,
        email: payload.email,
        password: payload.password,
        status: EStatusUser.ACTIVE,
      };

      await expect(
        repository.findWithPasswordBy({ email: payload.email }),
      ).resolves.toEqual(expected);
      await expect(repository.findWithPasswordBy({ id })).resolves.toEqual(
        expected,
      );
    });

    it('returns null when nothing matches', async () => {
      const repository = makeRepository();

      await expect(
        repository.findWithPasswordBy({ email: 'missing@example.com' }),
      ).resolves.toBeNull();
    });

    it('throws when called without criteria', async () => {
      const repository = makeRepository();

      await expect(repository.findWithPasswordBy({})).rejects.toThrow(
        'Nenhum critério de busca fornecido',
      );
    });
  });

  describe('update', () => {
    it('updates the given fields returning public columns', async () => {
      const repository = makeRepository();
      const created = await repository.create(payload);

      const updated = await repository.update(created.id, { name: 'Jane' });

      expect(Object.keys(updated!).sort()).toEqual(PUBLIC_KEYS);
      expect(updated).toMatchObject({
        id: created.id,
        name: 'Jane',
        email: payload.email,
      });
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it('updates the status and the password', async () => {
      const repository = makeRepository();
      const { id } = await repository.create(payload);

      await repository.update(id, { password: 'new-hash' });

      await expect(
        repository.findWithPasswordBy({ id }),
      ).resolves.toMatchObject({ password: 'new-hash' });

      await repository.update(id, { status: EStatusUser.INACTIVE });

      await expect(
        repository.findBy({ columns: { id, status: [EStatusUser.INACTIVE] } }),
      ).resolves.toHaveLength(1);
      await expect(repository.findWithPasswordBy({ id })).resolves.toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      const repository = makeRepository();

      await expect(
        repository.update('01970000-0000-7000-8000-000000000099', {
          name: 'Jane',
        }),
      ).resolves.toBeNull();
    });

    it('throws ConflictException when the email already exists', async () => {
      const repository = makeRepository();
      await repository.create(payload);
      const other = await repository.create({
        ...payload,
        email: 'jane.doe@example.com',
      });

      await expect(
        repository.update(other.id, { email: payload.email }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
