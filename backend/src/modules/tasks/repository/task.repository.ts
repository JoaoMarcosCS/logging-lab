import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { TaskEntity } from '../entity/task.entity.js';
import type {
  CreateTaskParams,
  FindActiveTaskByParams,
  ITaskRepository,
  PublicTask,
  UpdateTaskParams,
} from './task-interface.repository.js';

const PUBLIC_COLUMNS =
  'id, board_id AS "boardId", title, description, priority, work_status AS "workStatus", created_at AS "createdAt", updated_at AS "updatedAt"';

@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repository: Repository<TaskEntity>,
  ) {}

  async create(data: CreateTaskParams): Promise<PublicTask> {
    const { raw } = await this.repository
      .createQueryBuilder()
      .insert()
      .into(TaskEntity)
      .values({ id: uuidv7(), ...data })
      .updateEntity(false)
      .returning(PUBLIC_COLUMNS)
      .execute();

    return raw[0];
  }

  async findActiveBy(data: FindActiveTaskByParams): Promise<PublicTask[]> {
    const query = this.repository
      .createQueryBuilder('t')
      .select(PUBLIC_COLUMNS)
      .where('t.is_active = true')
      .andWhere('t.board_id = :boardId', { boardId: data.columns.boardId })
      .orderBy('t.id', 'DESC');

    if (data.columns.id) {
      query.andWhere('t.id = :id', { id: data.columns.id });
    }

    if (data.columns.priority !== undefined) {
      query.andWhere('t.priority = :priority', {
        priority: data.columns.priority,
      });
    }

    if (data.columns.workStatus !== undefined) {
      query.andWhere('t.work_status = :workStatus', {
        workStatus: data.columns.workStatus,
      });
    }

    if (data.cursor) {
      query.andWhere('t.id < :cursor', { cursor: data.cursor });
    }

    if (data.limit) {
      query.limit(data.limit);
    }

    return await query.getRawMany<PublicTask>();
  }

  async update(id: string, data: UpdateTaskParams): Promise<PublicTask | null> {
    const { raw } = await this.repository
      .createQueryBuilder()
      .update(TaskEntity)
      .set(data)
      .where('id = :id AND is_active = true', { id })
      .updateEntity(false)
      .returning(PUBLIC_COLUMNS)
      .execute();

    return raw[0] ?? null;
  }

  async deactivate(id: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(TaskEntity)
      .set({ isActive: false })
      .where('id = :id', { id })
      .execute();
  }
}
