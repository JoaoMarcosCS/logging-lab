import { Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import type { CreateTaskData } from './create-task.schema.js';
import { GetBoardUseCase } from '../../../boards/usecase/get/get-board.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getBoardUseCase: GetBoardUseCase,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(
    userId: string,
    boardId: string,
    data: CreateTaskData,
  ): Promise<PublicTask> {
    await this.getBoardUseCase.execute(userId, boardId);

    const task = await this.taskRepository.create({
      boardId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority,
    });

    await this.cacheProvider.invalidateByPrefix(
      cacheKeys.tasksOfBoard(boardId),
    );

    return task;
  }
}
