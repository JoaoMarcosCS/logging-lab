import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
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
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../../../shared/enums/tasks/task-work-status.enum.js';

@Injectable()
export class ListTasksUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getBoardUseCase: GetBoardUseCase,
    private readonly cacheProvider: ICacheProvider,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(ListTasksUseCase.name);
  }

  async execute(
    userId: string,
    boardId: string,
    data: ListTasksData,
  ): Promise<Paginated<PublicTask>> {
    await this.getBoardUseCase.execute(userId, boardId);

    // Filtros usados na consulta, para o log. Relacionam consultas lentas ou vazias com
    // o filtro que as gerou. Os enums são numéricos; o nome (CLOSED, HIGH) é mais legível.
    // Filtro não informado fica undefined, e o pino omite o campo.
    const filters = {
      boardId,
      workStatus:
        data.workStatus === undefined
          ? undefined
          : EWorkStatusTask[data.workStatus],
      priority:
        data.priority === undefined ? undefined : EPriorityTask[data.priority],
    };

    const key = cacheKeys.tasksPage(boardId, data);
    const cached = await this.cacheProvider.get<Paginated<PublicTask>>(key);

    if (cached) {
      // Leitura: só em debug (LOG_LEVEL=debug). O access log já registra a requisição.
      this.logger.debug(
        { ...filters, cacheHit: true, resultCount: cached.data.length },
        'tasks listed',
      );
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

    this.logger.debug(
      { ...filters, cacheHit: false, resultCount: page.data.length },
      'tasks listed',
    );

    return page;
  }
}
