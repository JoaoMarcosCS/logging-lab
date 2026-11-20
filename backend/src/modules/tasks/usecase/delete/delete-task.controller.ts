import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { DeleteTaskUseCase } from './delete-task.usecase.js';
import { IdParamSchema } from '../get/get-task.schema.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards/:boardId/tasks')
export class DeleteTaskController {
  constructor(private readonly deleteTaskUseCase: DeleteTaskUseCase) {}

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('boardId', { schema: IdParamSchema }) boardId: string,
    @Param('taskId', { schema: IdParamSchema }) taskId: string,
  ): Promise<void> {
    await this.deleteTaskUseCase.execute(user.id, boardId, taskId);
  }
}
