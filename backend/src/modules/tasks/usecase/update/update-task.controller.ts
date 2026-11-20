import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdateTaskSchema } from './update-task.schema.js';
import type { UpdateTaskData } from './update-task.schema.js';
import { UpdateTaskUseCase } from './update-task.usecase.js';
import { IdParamSchema } from '../get/get-task.schema.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards/:boardId/tasks')
export class UpdateTaskController {
  constructor(private readonly updateTaskUseCase: UpdateTaskUseCase) {}

  @Patch(':taskId')
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('boardId', { schema: IdParamSchema }) boardId: string,
    @Param('taskId', { schema: IdParamSchema }) taskId: string,
    @Body({ schema: UpdateTaskSchema }) body: UpdateTaskData,
  ): Promise<PublicTask> {
    return await this.updateTaskUseCase.execute(user.id, boardId, taskId, body);
  }
}
