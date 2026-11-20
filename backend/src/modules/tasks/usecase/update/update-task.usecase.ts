import { Injectable, NotFoundException } from '@nestjs/common';
import { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import type { UpdateTaskData } from './update-task.schema.js';
import { GetTaskUseCase } from '../get/get-task.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(
    userId: string,
    boardId: string,
    taskId: string,
    data: UpdateTaskData,
  ): Promise<PublicTask> {
    await this.getTaskUseCase.execute(userId, boardId, taskId);

    const task = await this.taskRepository.update(taskId, data);

    if (!task) {
      throw new NotFoundException(MessageError.TASK_NOT_FOUND);
    }

    await Promise.all([
      this.cacheProvider.invalidate(cacheKeys.task(boardId, taskId)),
      this.cacheProvider.invalidateByPrefix(cacheKeys.tasksOfBoard(boardId)),
    ]);

    return task;
  }
}
