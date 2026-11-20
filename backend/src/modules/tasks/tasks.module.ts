import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entity/task.entity.js';
import { TaskRepository } from './repository/task.repository.js';
import { ITaskRepository } from './repository/task-interface.repository.js';
import { BoardsModule } from '../boards/boards.module.js';
import { CreateTaskController } from './usecase/create/create-task.controller.js';
import { CreateTaskUseCase } from './usecase/create/create-task.usecase.js';
import { ListTasksController } from './usecase/list/list-tasks.controller.js';
import { ListTasksUseCase } from './usecase/list/list-tasks.usecase.js';
import { GetTaskController } from './usecase/get/get-task.controller.js';
import { GetTaskUseCase } from './usecase/get/get-task.usecase.js';
import { UpdateTaskController } from './usecase/update/update-task.controller.js';
import { UpdateTaskUseCase } from './usecase/update/update-task.usecase.js';
import { DeleteTaskController } from './usecase/delete/delete-task.controller.js';
import { DeleteTaskUseCase } from './usecase/delete/delete-task.usecase.js';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity]), BoardsModule],
  controllers: [
    CreateTaskController,
    ListTasksController,
    GetTaskController,
    UpdateTaskController,
    DeleteTaskController,
  ],
  providers: [
    { provide: ITaskRepository, useClass: TaskRepository },
    CreateTaskUseCase,
    ListTasksUseCase,
    GetTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
  ],
})
export class TasksModule {}
