import { Controller, Get, Param } from '@nestjs/common';
import { IdParamSchema } from './get-task.schema.js';
import { GetTaskUseCase } from './get-task.usecase.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards/:boardId/tasks')
export class GetTaskController {
  constructor(private readonly getTaskUseCase: GetTaskUseCase) {}

  @Get(':taskId')
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('boardId', { schema: IdParamSchema }) boardId: string,
    @Param('taskId', { schema: IdParamSchema }) taskId: string,
  ): Promise<PublicTask> {
    return await this.getTaskUseCase.execute(user.id, boardId, taskId);
  }
}
