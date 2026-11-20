import type { TaskEntity } from '../entity/task.entity.js';

export type PublicTask = Pick<
  TaskEntity,
  | 'id'
  | 'boardId'
  | 'title'
  | 'description'
  | 'priority'
  | 'workStatus'
  | 'createdAt'
  | 'updatedAt'
>;

export type CreateTaskParams = Pick<
  TaskEntity,
  'boardId' | 'title' | 'description' | 'priority'
>;

export type UpdateTaskParams = Partial<
  Pick<TaskEntity, 'title' | 'description' | 'priority' | 'workStatus'>
>;

export type FindActiveTaskByParams = {
  columns: Pick<TaskEntity, 'boardId'> &
    Partial<Pick<TaskEntity, 'id' | 'priority' | 'workStatus'>>;
  limit?: number;
  cursor?: string;
};

export abstract class ITaskRepository {
  abstract create(data: CreateTaskParams): Promise<PublicTask>;
  abstract findActiveBy(data: FindActiveTaskByParams): Promise<PublicTask[]>;
  abstract update(
    id: string,
    data: UpdateTaskParams,
  ): Promise<PublicTask | null>;
  abstract deactivate(id: string): Promise<void>;
}
