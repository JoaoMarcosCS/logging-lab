import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { DeleteTaskUseCase } from './delete-task.usecase.js';
import type { GetTaskUseCase } from '../get/get-task.usecase.js';
import type { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  mockLogger,
  BOARD_ID,
  makeTask,
  mockCacheProvider,
  mockTaskRepository,
  TASK_ID,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

describe('DeleteTaskUseCase', () => {
  let repository: Mocked<ITaskRepository>;
  let cache: Mocked<ICacheProvider>;
  let getTask: { execute: ReturnType<typeof vi.fn> };
  let logger: MockedLogger;
  let useCase: DeleteTaskUseCase;

  beforeEach(() => {
    repository = mockTaskRepository();
    cache = mockCacheProvider();
    getTask = { execute: vi.fn().mockResolvedValue(makeTask()) };
    logger = mockLogger();
    useCase = new DeleteTaskUseCase(
      repository,
      getTask as unknown as GetTaskUseCase,
      cache as unknown as ICacheProvider,
      logger as unknown as PinoLogger,
    );
  });

  it('deactivates the task and invalidates its caches', async () => {
    await useCase.execute(USER_ID, BOARD_ID, TASK_ID);

    expect(repository.deactivate).toHaveBeenCalledWith(TASK_ID);
    expect(cache.invalidate).toHaveBeenCalledWith(
      cacheKeys.task(BOARD_ID, TASK_ID),
    );
    expect(cache.invalidateByPrefix).toHaveBeenCalledWith(
      cacheKeys.tasksOfBoard(BOARD_ID),
    );
  });

  it('responds 404 when the task was already deleted', async () => {
    getTask.execute.mockRejectedValue(new NotFoundException());

    await expect(
      useCase.execute(USER_ID, BOARD_ID, TASK_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deactivate).not.toHaveBeenCalled();
  });
});
