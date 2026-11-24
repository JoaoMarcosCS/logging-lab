import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { UpdateTaskUseCase } from './update-task.usecase.js';
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
import { EWorkStatusTask } from '../../../../shared/enums/tasks/task-work-status.enum.js';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';

describe('UpdateTaskUseCase', () => {
  let repository: Mocked<ITaskRepository>;
  let cache: Mocked<ICacheProvider>;
  let getTask: { execute: ReturnType<typeof vi.fn> };
  let logger: MockedLogger;
  let useCase: UpdateTaskUseCase;

  beforeEach(() => {
    repository = mockTaskRepository();
    cache = mockCacheProvider();
    getTask = { execute: vi.fn().mockResolvedValue(makeTask()) };
    logger = mockLogger();
    useCase = new UpdateTaskUseCase(
      repository,
      getTask as unknown as GetTaskUseCase,
      cache as unknown as ICacheProvider,
      logger as unknown as PinoLogger,
    );
  });

  it('updates the task and invalidates its detail and the board task lists', async () => {
    const updated = makeTask({ workStatus: EWorkStatusTask.CLOSED });
    repository.update.mockResolvedValue(updated);
    const data = { workStatus: EWorkStatusTask.CLOSED, description: null };

    await expect(
      useCase.execute(USER_ID, BOARD_ID, TASK_ID, data),
    ).resolves.toEqual(updated);
    expect(getTask.execute).toHaveBeenCalledWith(USER_ID, BOARD_ID, TASK_ID);
    expect(repository.update).toHaveBeenCalledWith(TASK_ID, data);
    expect(cache.invalidate).toHaveBeenCalledWith(
      cacheKeys.task(BOARD_ID, TASK_ID),
    );
    expect(cache.invalidateByPrefix).toHaveBeenCalledWith(
      cacheKeys.tasksOfBoard(BOARD_ID),
    );
    expect(logger.info).toHaveBeenCalledWith(
      {
        event: 'task.updated',
        boardId: BOARD_ID,
        taskId: TASK_ID,
        changedFields: ['workStatus', 'description'],
        previousWorkStatus: EWorkStatusTask[makeTask().workStatus],
        workStatus: 'CLOSED',
        priority: EPriorityTask[updated.priority],
      },
      'task updated',
    );
  });

  it('does not update a task the user cannot access', async () => {
    getTask.execute.mockRejectedValue(new NotFoundException());

    await expect(
      useCase.execute(USER_ID, BOARD_ID, TASK_ID, { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the task was deleted meanwhile', async () => {
    repository.update.mockResolvedValue(null);

    await expect(
      useCase.execute(USER_ID, BOARD_ID, TASK_ID, { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
