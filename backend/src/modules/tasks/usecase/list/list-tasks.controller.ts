import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListTasksSchema } from './list-tasks.schema.js';
import type { ListTasksData } from './list-tasks.schema.js';
import { ListTasksUseCase } from './list-tasks.usecase.js';
import { IdParamSchema } from '../get/get-task.schema.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';
import type { Paginated } from '../../../../shared/utils/paginate.js';

@Controller('boards/:boardId/tasks')
export class ListTasksController {
  constructor(private readonly listTasksUseCase: ListTasksUseCase) {}

  @Get()
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('boardId', { schema: IdParamSchema }) boardId: string,
    @Query({ schema: ListTasksSchema }) query: ListTasksData,
  ): Promise<Paginated<PublicTask>> {
    return await this.listTasksUseCase.execute(user.id, boardId, query);
  }
}
