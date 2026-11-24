import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { GetTaskUseCase } from './get-task.usecase.js';
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
  TASK_ID,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';

describe('GetTaskUseCase', () => {
  let repository: Mocked<ITaskRepository>;
  let cache: Mocked<ICacheProvider>;
  let getBoard: { execute: ReturnType<typeof vi.fn> };
  let logger: MockedLogger;
  let useCase: GetTaskUseCase;

  beforeEach(() => {
    repository = mockTaskRepository();
    cache = mockCacheProvider();
    getBoard = { execute: vi.fn().mockResolvedValue(makeBoard()) };
    logger = mockLogger();
    useCase = new GetTaskUseCase(
      repository,
      getBoard as unknown as GetBoardUseCase,
      cache as unknown as ICacheProvider,
      logger as unknown as PinoLogger,
    );
  });

  it('checks the board owner before reading the cache', async () => {
    getBoard.execute.mockRejectedValue(new NotFoundException());

    await expect(
      useCase.execute(USER_ID, BOARD_ID, TASK_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('returns the cached task', async () => {
    const task = makeTask();
    cache.get.mockResolvedValue(task);

    await expect(useCase.execute(USER_ID, BOARD_ID, TASK_ID)).resolves.toEqual(
      task,
    );
    expect(cache.get).toHaveBeenCalledWith(cacheKeys.task(BOARD_ID, TASK_ID));
    expect(repository.findActiveBy).not.toHaveBeenCalled();
  });

  it('loads the task scoped to the board and caches it', async () => {
    const task = makeTask();
    repository.findActiveBy.mockResolvedValue([task]);

    await expect(useCase.execute(USER_ID, BOARD_ID, TASK_ID)).resolves.toEqual(
      task,
    );
    expect(repository.findActiveBy).toHaveBeenCalledWith({
      columns: { boardId: BOARD_ID, id: TASK_ID },
    });
    expect(cache.set).toHaveBeenCalledWith(
      cacheKeys.task(BOARD_ID, TASK_ID),
      task,
      CACHE_TTL_SECONDS,
    );
  });

  it('throws NotFoundException when the task does not exist or was deleted', async () => {
    repository.findActiveBy.mockResolvedValue([]);

    await expect(
      useCase.execute(USER_ID, BOARD_ID, TASK_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
