import { Injectable, NotFoundException } from '@nestjs/common';
import { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import { GetBoardUseCase } from '../../../boards/usecase/get/get-board.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class GetTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getBoardUseCase: GetBoardUseCase,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(
    userId: string,
    boardId: string,
    taskId: string,
  ): Promise<PublicTask> {
    await this.getBoardUseCase.execute(userId, boardId);

    const key = cacheKeys.task(boardId, taskId);
    const cached = await this.cacheProvider.get<PublicTask>(key);

    if (cached) {
      return cached;
    }

    const [task] = await this.taskRepository.findActiveBy({
      columns: { boardId, id: taskId },
    });

    if (!task) {
      throw new NotFoundException(MessageError.TASK_NOT_FOUND);
    }

    await this.cacheProvider.set(key, task, CACHE_TTL_SECONDS);

    return task;
  }
}
