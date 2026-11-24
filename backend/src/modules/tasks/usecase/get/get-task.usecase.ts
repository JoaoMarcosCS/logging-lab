import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
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
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(GetTaskUseCase.name);
  }

  async execute(
    userId: string,
    boardId: string,
    taskId: string,
  ): Promise<PublicTask> {
    await this.getBoardUseCase.execute(userId, boardId);

    const key = cacheKeys.task(boardId, taskId);
    const cached = await this.cacheProvider.get<PublicTask>(key);

    if (cached) {
      // Leitura: só em debug (LOG_LEVEL=debug). O access log já registra a requisição.
      this.logger.debug({ boardId, taskId, cacheHit: true }, 'task loaded');
      return cached;
    }

    const [task] = await this.taskRepository.findActiveBy({
      columns: { boardId, id: taskId },
    });

    if (!task) {
      throw new NotFoundException(MessageError.TASK_NOT_FOUND);
    }

    await this.cacheProvider.set(key, task, CACHE_TTL_SECONDS);

    this.logger.debug({ boardId, taskId, cacheHit: false }, 'task loaded');

    return task;
  }
}
