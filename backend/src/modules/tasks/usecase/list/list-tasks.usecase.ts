import { Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import type { ListTasksData } from './list-tasks.schema.js';
import { GetBoardUseCase } from '../../../boards/usecase/get/get-board.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';
import { paginate } from '../../../../shared/utils/paginate.js';
import type { Paginated } from '../../../../shared/utils/paginate.js';

@Injectable()
export class ListTasksUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getBoardUseCase: GetBoardUseCase,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(
    userId: string,
    boardId: string,
    data: ListTasksData,
  ): Promise<Paginated<PublicTask>> {
    await this.getBoardUseCase.execute(userId, boardId);

    const key = cacheKeys.tasksPage(boardId, data);
    const cached = await this.cacheProvider.get<Paginated<PublicTask>>(key);

    if (cached) {
      return cached;
    }

    const tasks = await this.taskRepository.findActiveBy({
      columns: {
        boardId,
        workStatus: data.workStatus,
        priority: data.priority,
      },
      limit: data.limit + 1,
      cursor: data.cursor,
    });
    const page = paginate(tasks, data.limit);

    await this.cacheProvider.set(key, page, CACHE_TTL_SECONDS);

    return page;
  }
}
