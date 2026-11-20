import { AppDataSource } from '../../../../infra/database/data-source.js';
import { BoardEntity } from '../../../../modules/boards/entity/board.entity.js';
import { BoardRepository } from '../../../../modules/boards/repository/board.repository.js';
import { TaskEntity } from '../../../../modules/tasks/entity/task.entity.js';
import { TaskRepository } from '../../../../modules/tasks/repository/task.repository.js';
import { UserEntity } from '../../../../modules/users/entity/user.entity.js';
import { UserRepository } from '../../../../modules/users/repository/user.repository.js';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../../../shared/enums/tasks/task-work-status.enum.js';

const PUBLIC_KEYS = [
  'boardId',
  'createdAt',
  'description',
  'id',
  'priority',
  'title',
  'updatedAt',
  'workStatus',
];

const makeRepository = () =>
  new TaskRepository(AppDataSource.getRepository(TaskEntity));

const createBoard = async () => {
  const users = new UserRepository(AppDataSource.getRepository(UserEntity));
  const boards = new BoardRepository(AppDataSource.getRepository(BoardEntity));
  const user = await users.create({
    name: 'John Doe',
    email: `john.${Math.random()}@example.com`,
    password: 'hashed',
  });
  return await boards.create({
    userId: user.id,
    title: 'Estudos',
    description: null,
  });
};

const payload = {
  title: 'Ler sobre cache',
  description: null,
  priority: EPriorityTask.HIGH,
};

describe('TaskRepository (integração)', () => {
  describe('create', () => {
    it('returns public columns and starts awaiting start', async () => {
      const board = await createBoard();

      const task = await makeRepository().create({
        ...payload,
        boardId: board.id,
      });

      expect(Object.keys(task).sort()).toEqual(PUBLIC_KEYS);
      expect(task).toMatchObject({
        boardId: board.id,
        title: payload.title,
        description: null,
        priority: EPriorityTask.HIGH,
        workStatus: EWorkStatusTask.AWAITING_START,
      });
      expect(task.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findActiveBy', () => {
    it('finds by board and by id scoped to the board', async () => {
      const [board, other] = await Promise.all([createBoard(), createBoard()]);
      const repository = makeRepository();
      const task = await repository.create({ ...payload, boardId: board.id });

      await expect(
        repository.findActiveBy({ columns: { boardId: board.id } }),
      ).resolves.toEqual([task]);
      await expect(
        repository.findActiveBy({
          columns: { boardId: board.id, id: task.id },
        }),
      ).resolves.toEqual([task]);
      await expect(
        repository.findActiveBy({
          columns: { boardId: other.id, id: task.id },
        }),
      ).resolves.toEqual([]);
    });

    it('filters by priority and work status', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      const high = await repository.create({ ...payload, boardId: board.id });
      const low = await repository.create({
        ...payload,
        boardId: board.id,
        priority: EPriorityTask.LOW,
      });
      const doing = await repository.update(low.id, {
        workStatus: EWorkStatusTask.IN_PROGRESS,
      });

      await expect(
        repository.findActiveBy({
          columns: { boardId: board.id, priority: EPriorityTask.HIGH },
        }),
      ).resolves.toEqual([high]);
      await expect(
        repository.findActiveBy({
          columns: {
            boardId: board.id,
            workStatus: EWorkStatusTask.IN_PROGRESS,
          },
        }),
      ).resolves.toEqual([doing]);
      await expect(
        repository.findActiveBy({
          columns: { boardId: board.id, priority: EPriorityTask.LOW },
        }),
      ).resolves.toEqual([doing]);
    });

    it('filters by the zero value of an enum', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      await repository.create({ ...payload, boardId: board.id });
      const low = await repository.create({
        ...payload,
        boardId: board.id,
        priority: EPriorityTask.LOW,
      });

      await expect(
        repository.findActiveBy({
          columns: { boardId: board.id, priority: EPriorityTask.LOW },
        }),
      ).resolves.toEqual([low]);
    });

    it('ignores deleted tasks', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      const task = await repository.create({ ...payload, boardId: board.id });

      await repository.deactivate(task.id);

      await expect(
        repository.findActiveBy({ columns: { boardId: board.id } }),
      ).resolves.toEqual([]);
    });

    it('paginates from newest to oldest using limit and cursor', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      const first = await repository.create({ ...payload, boardId: board.id });
      const second = await repository.create({ ...payload, boardId: board.id });
      const third = await repository.create({ ...payload, boardId: board.id });

      const firstPage = await repository.findActiveBy({
        columns: { boardId: board.id },
        limit: 2,
      });
      const secondPage = await repository.findActiveBy({
        columns: { boardId: board.id },
        limit: 2,
        cursor: firstPage[1].id,
      });

      expect(firstPage.map(({ id }) => id)).toEqual([third.id, second.id]);
      expect(secondPage.map(({ id }) => id)).toEqual([first.id]);
    });
  });

  describe('update', () => {
    it('updates the given fields returning public columns', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      const task = await repository.create({
        ...payload,
        boardId: board.id,
        description: 'Antiga',
      });

      const updated = await repository.update(task.id, {
        workStatus: EWorkStatusTask.CLOSED,
        priority: EPriorityTask.LOW,
      });

      expect(Object.keys(updated!).sort()).toEqual(PUBLIC_KEYS);
      expect(updated).toMatchObject({
        title: payload.title,
        description: 'Antiga',
        workStatus: EWorkStatusTask.CLOSED,
        priority: EPriorityTask.LOW,
      });
    });

    it('clears the description with null', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      const task = await repository.create({
        ...payload,
        boardId: board.id,
        description: 'Antiga',
      });

      await expect(
        repository.update(task.id, { description: null }),
      ).resolves.toMatchObject({ description: null });
    });

    it('returns null for a deleted task', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      const task = await repository.create({ ...payload, boardId: board.id });
      await repository.deactivate(task.id);

      await expect(
        repository.update(task.id, { title: 'Novo' }),
      ).resolves.toBeNull();
    });
  });

  describe('deactivate', () => {
    it('deactivates only the given task', async () => {
      const board = await createBoard();
      const repository = makeRepository();
      const removed = await repository.create({
        ...payload,
        boardId: board.id,
      });
      const kept = await repository.create({ ...payload, boardId: board.id });

      await repository.deactivate(removed.id);

      await expect(
        repository.findActiveBy({ columns: { boardId: board.id } }),
      ).resolves.toEqual([kept]);
    });
  });
});
