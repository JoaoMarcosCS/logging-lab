import { AppDataSource } from '../../../../infra/database/data-source.js';
import { BoardEntity } from '../../../../modules/boards/entity/board.entity.js';
import { BoardRepository } from '../../../../modules/boards/repository/board.repository.js';
import { TaskEntity } from '../../../../modules/tasks/entity/task.entity.js';
import { TaskRepository } from '../../../../modules/tasks/repository/task.repository.js';
import { UserEntity } from '../../../../modules/users/entity/user.entity.js';
import { UserRepository } from '../../../../modules/users/repository/user.repository.js';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';

const PUBLIC_KEYS = [
  'createdAt',
  'description',
  'id',
  'title',
  'updatedAt',
  'userId',
];

const makeRepository = () =>
  new BoardRepository(AppDataSource.getRepository(BoardEntity));

const makeTaskRepository = () =>
  new TaskRepository(AppDataSource.getRepository(TaskEntity));

const createUser = async (email = 'john.doe@example.com') => {
  const users = new UserRepository(AppDataSource.getRepository(UserEntity));
  return await users.create({ name: 'John Doe', email, password: 'hashed' });
};

describe('BoardRepository (integração)', () => {
  describe('create', () => {
    it('returns only public columns in camelCase', async () => {
      const user = await createUser();

      const board = await makeRepository().create({
        userId: user.id,
        title: 'Estudos',
        description: null,
      });

      expect(Object.keys(board).sort()).toEqual(PUBLIC_KEYS);
      expect(board).toMatchObject({
        userId: user.id,
        title: 'Estudos',
        description: null,
      });
      expect(board.createdAt).toBeInstanceOf(Date);
      expect(board.id[14]).toBe('7');
    });
  });

  describe('findActiveBy', () => {
    it('finds by id and by user returning public columns', async () => {
      const user = await createUser();
      const repository = makeRepository();
      const board = await repository.create({
        userId: user.id,
        title: 'Estudos',
        description: 'Coisas para estudar',
      });

      await expect(
        repository.findActiveBy({ columns: { id: board.id } }),
      ).resolves.toEqual([board]);
      await expect(
        repository.findActiveBy({ columns: { userId: user.id } }),
      ).resolves.toEqual([board]);
    });

    it('returns only boards of the given user', async () => {
      const [maria, joao] = await Promise.all([
        createUser('maria@example.com'),
        createUser('joao@example.com'),
      ]);
      const repository = makeRepository();
      const board = await repository.create({
        userId: maria.id,
        title: 'A',
        description: null,
      });
      await repository.create({
        userId: joao.id,
        title: 'B',
        description: null,
      });

      await expect(
        repository.findActiveBy({ columns: { userId: maria.id } }),
      ).resolves.toEqual([board]);
    });

    it('ignores deleted boards', async () => {
      const user = await createUser();
      const repository = makeRepository();
      const board = await repository.create({
        userId: user.id,
        title: 'Estudos',
        description: null,
      });

      await repository.deactivateWithTasks(board.id);

      await expect(
        repository.findActiveBy({ columns: { id: board.id } }),
      ).resolves.toEqual([]);
    });

    it('paginates from newest to oldest using limit and cursor', async () => {
      const user = await createUser();
      const repository = makeRepository();
      const first = await repository.create({
        userId: user.id,
        title: '1',
        description: null,
      });
      const second = await repository.create({
        userId: user.id,
        title: '2',
        description: null,
      });
      const third = await repository.create({
        userId: user.id,
        title: '3',
        description: null,
      });

      const firstPage = await repository.findActiveBy({
        columns: { userId: user.id },
        limit: 2,
      });
      const secondPage = await repository.findActiveBy({
        columns: { userId: user.id },
        limit: 2,
        cursor: firstPage[1].id,
      });

      expect(firstPage.map(({ id }) => id)).toEqual([third.id, second.id]);
      expect(secondPage.map(({ id }) => id)).toEqual([first.id]);
    });

    it('throws when called without criteria', async () => {
      await expect(
        makeRepository().findActiveBy({ columns: {} }),
      ).rejects.toThrow('Nenhum critério de busca fornecido');
    });
  });

  describe('update', () => {
    it('updates the given fields and keeps the others', async () => {
      const user = await createUser();
      const repository = makeRepository();
      const board = await repository.create({
        userId: user.id,
        title: 'Estudos',
        description: 'Antiga',
      });

      const updated = await repository.update(board.id, { title: 'Novo' });

      expect(Object.keys(updated!).sort()).toEqual(PUBLIC_KEYS);
      expect(updated).toMatchObject({ title: 'Novo', description: 'Antiga' });
    });

    it('clears the description with null', async () => {
      const user = await createUser();
      const repository = makeRepository();
      const board = await repository.create({
        userId: user.id,
        title: 'Estudos',
        description: 'Antiga',
      });

      await expect(
        repository.update(board.id, { description: null }),
      ).resolves.toMatchObject({ description: null });
    });

    it('returns null for a deleted board', async () => {
      const user = await createUser();
      const repository = makeRepository();
      const board = await repository.create({
        userId: user.id,
        title: 'Estudos',
        description: null,
      });
      await repository.deactivateWithTasks(board.id);

      await expect(
        repository.update(board.id, { title: 'Novo' }),
      ).resolves.toBeNull();
    });
  });

  describe('deactivateWithTasks', () => {
    it('deactivates the board and only its tasks', async () => {
      const user = await createUser();
      const repository = makeRepository();
      const tasks = makeTaskRepository();
      const board = await repository.create({
        userId: user.id,
        title: 'A',
        description: null,
      });
      const other = await repository.create({
        userId: user.id,
        title: 'B',
        description: null,
      });
      const task = {
        title: 't',
        description: null,
        priority: EPriorityTask.LOW,
      };
      await tasks.create({ ...task, boardId: board.id });
      const kept = await tasks.create({ ...task, boardId: other.id });

      await repository.deactivateWithTasks(board.id);

      await expect(
        tasks.findActiveBy({ columns: { boardId: board.id } }),
      ).resolves.toEqual([]);
      await expect(
        tasks.findActiveBy({ columns: { boardId: other.id } }),
      ).resolves.toEqual([kept]);
      await expect(
        repository.findActiveBy({ columns: { userId: user.id } }),
      ).resolves.toEqual([other]);
    });
  });
});
