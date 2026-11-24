import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ITaskRepository } from '../../repository/task-interface.repository.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import type { UpdateTaskData } from './update-task.schema.js';
import { GetTaskUseCase } from '../get/get-task.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../../../shared/enums/tasks/task-work-status.enum.js';

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly cacheProvider: ICacheProvider,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(UpdateTaskUseCase.name);
  }

  async execute(
    userId: string,
    boardId: string,
    taskId: string,
    data: UpdateTaskData,
  ): Promise<PublicTask> {
    // Guardado antes da alteração, para o log mostrar de qual status a tarefa saiu.
    const previous = await this.getTaskUseCase.execute(userId, boardId, taskId);

    const task = await this.taskRepository.update(taskId, data);

    if (!task) {
      throw new NotFoundException(MessageError.TASK_NOT_FOUND);
    }

    await Promise.all([
      this.cacheProvider.invalidate(cacheKeys.task(boardId, taskId)),
      this.cacheProvider.invalidateByPrefix(cacheKeys.tasksOfBoard(boardId)),
    ]);

    // changedFields traz só os nomes dos campos enviados. Status e prioridade são valores
    // fixos do enum e entram no log; título e descrição, que são texto do usuário, não.
    // Com previousWorkStatus e workStatus dá para contar transições (ex.: IN_PROGRESS para CLOSED).
    // Os enums são numéricos; EWorkStatusTask[3] devolve o nome "CLOSED", legível no Kibana.
    this.logger.info(
      {
        event: 'task.updated',
        boardId,
        taskId,
        changedFields: Object.keys(data),
        previousWorkStatus: EWorkStatusTask[previous.workStatus],
        workStatus: EWorkStatusTask[task.workStatus],
        priority: EPriorityTask[task.priority],
      },
      'task updated',
    );

    return task;
  }
}
