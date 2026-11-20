import { NotFoundException } from '@nestjs/common';
import { CreateTaskUseCase } from './create-task.usecase.js';
import type { GetBoardUseCase } from '../../../boards/usecase/get/get-board.usecase.js';
import type { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  BOARD_ID,
  makeBoard,
  makeTask,
  mockCacheProvider,
  mockTaskRepository,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked } from '../../../../tests/mocks/index.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';

describe('CreateTaskUseCase', () => {
  let repository: Mocked<ITaskRepository>;
  let cache: Mocked<ICacheProvider>;
  let getBoard: { execute: ReturnType<typeof vi.fn> };
  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    repository = mockTaskRepository();
    cache = mockCacheProvider();
    getBoard = { execute: vi.fn().mockResolvedValue(makeBoard()) };
    useCase = new CreateTaskUseCase(
      repository,
      getBoard as unknown as GetBoardUseCase,
      cache as unknown as ICacheProvider,
    );
  });

  it('creates the task in the board and invalidates the task lists', async () => {
    const task = makeTask();
    repository.create.mockResolvedValue(task);

    await expect(
      useCase.execute(USER_ID, BOARD_ID, {
        title: task.title,
        priority: EPriorityTask.HIGH,
      }),
    ).resolves.toEqual(task);
    expect(repository.create).toHaveBeenCalledWith({
      boardId: BOARD_ID,
      title: task.title,
      description: null,
      priority: EPriorityTask.HIGH,
    });
    expect(cache.invalidateByPrefix).toHaveBeenCalledWith(
      cacheKeys.tasksOfBoard(BOARD_ID),
    );
  });

  it('does not create a task in a board the user cannot access', async () => {
    getBoard.execute.mockRejectedValue(new NotFoundException());

    await expect(
      useCase.execute(USER_ID, BOARD_ID, {
        title: 'x',
        priority: EPriorityTask.LOW,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
