import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import type { CreateTaskData } from './create-task.schema.js';
import { GetBoardUseCase } from '../../../boards/usecase/get/get-board.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getBoardUseCase: GetBoardUseCase,
    private readonly cacheProvider: ICacheProvider,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(CreateTaskUseCase.name);
  }

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

    // Ids e a prioridade. Título e descrição ficam fora do log.
    // O enum é numérico (HIGH = 2); EPriorityTask[2] devolve o nome "HIGH", legível no Kibana.
    this.logger.info(
      {
        event: 'task.created',
        boardId,
        taskId: task.id,
        priority: EPriorityTask[task.priority],
      },
      'task created',
    );

    return task;
  }
}
