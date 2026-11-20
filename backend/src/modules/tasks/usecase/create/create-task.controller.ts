import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateTaskSchema } from './create-task.schema.js';
import type { CreateTaskData } from './create-task.schema.js';
import { CreateTaskUseCase } from './create-task.usecase.js';
import { IdParamSchema } from '../get/get-task.schema.js';
import type { PublicTask } from '../../repository/task-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards/:boardId/tasks')
export class CreateTaskController {
  constructor(private readonly createTaskUseCase: CreateTaskUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('boardId', { schema: IdParamSchema }) boardId: string,
    @Body({ schema: CreateTaskSchema }) body: CreateTaskData,
  ): Promise<PublicTask> {
    return await this.createTaskUseCase.execute(user.id, boardId, body);
  }
}
