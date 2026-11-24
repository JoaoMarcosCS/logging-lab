import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { ListTasksUseCase } from './list-tasks.usecase.js';
import type { GetBoardUseCase } from '../../../boards/usecase/get/get-board.usecase.js';
import type { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  mockLogger,
  BOARD_ID,
  makeBoard,
  makeTask,
  mockCacheProvider,
  mockTaskRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../../../shared/enums/tasks/task-work-status.enum.js';

const tasks = ['3', '2', '1'].map((n) =>
  makeTask({ id: `01970000-0000-7000-8000-00000000002${n}` }),
);

describe('ListTasksUseCase', () => {
  let repository: Mocked<ITaskRepository>;
  let cache: Mocked<ICacheProvider>;
  let getBoard: { execute: ReturnType<typeof vi.fn> };
  let logger: MockedLogger;
  let useCase: ListTasksUseCase;

  beforeEach(() => {
    repository = mockTaskRepository();
    cache = mockCacheProvider();
    getBoard = { execute: vi.fn().mockResolvedValue(makeBoard()) };
    logger = mockLogger();
    useCase = new ListTasksUseCase(
      repository,
      getBoard as unknown as GetBoardUseCase,
      cache as unknown as ICacheProvider,
      logger as unknown as PinoLogger,
    );
  });

  it('lists with filters, paginates and caches by the query', async () => {
    repository.findActiveBy.mockResolvedValue(tasks);
    const query = {
      limit: 2,
      workStatus: EWorkStatusTask.IN_PROGRESS,
      priority: EPriorityTask.HIGH,
    };

    const page = await useCase.execute(USER_ID, BOARD_ID, query);

    expect(page).toEqual({ data: tasks.slice(0, 2), nextCursor: tasks[1].id });
    expect(repository.findActiveBy).toHaveBeenCalledWith({
      columns: {
        boardId: BOARD_ID,
        workStatus: EWorkStatusTask.IN_PROGRESS,
        priority: EPriorityTask.HIGH,
      },
      limit: 3,
      cursor: undefined,
    });
    expect(cache.set).toHaveBeenCalledWith(
      cacheKeys.tasksPage(BOARD_ID, query),
      page,
      CACHE_TTL_SECONDS,
    );
  });

  it('returns the cached page', async () => {
    const page = { data: tasks, nextCursor: null };
    cache.get.mockResolvedValue(page);

    await expect(
      useCase.execute(USER_ID, BOARD_ID, { limit: 20 }),
    ).resolves.toEqual(page);
    expect(repository.findActiveBy).not.toHaveBeenCalled();
  });

  it('does not list tasks of a board the user cannot access', async () => {
    getBoard.execute.mockRejectedValue(new NotFoundException());

    await expect(
      useCase.execute(USER_ID, BOARD_ID, { limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(cache.get).not.toHaveBeenCalled();
  });
});
