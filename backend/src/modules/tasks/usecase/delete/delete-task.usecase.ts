import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ITaskRepository } from '../../repository/task-interface.repository.js';
import { GetTaskUseCase } from '../get/get-task.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly cacheProvider: ICacheProvider,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(DeleteTaskUseCase.name);
  }

  async execute(
    userId: string,
    boardId: string,
    taskId: string,
  ): Promise<void> {
    await this.getTaskUseCase.execute(userId, boardId, taskId);

    await this.taskRepository.deactivate(taskId);

    await Promise.all([
      this.cacheProvider.invalidate(cacheKeys.task(boardId, taskId)),
      this.cacheProvider.invalidateByPrefix(cacheKeys.tasksOfBoard(boardId)),
    ]);

    // Exclusão lógica. O evento registra quem apagou e quando, sem consultar o banco.
    this.logger.info(
      { event: 'task.deleted', boardId, taskId },
      'task deleted',
    );
  }
}
