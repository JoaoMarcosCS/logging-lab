import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { BoardEntity } from '../entity/board.entity.js';
import { TaskEntity } from '../../tasks/entity/task.entity.js';
import type {
  CreateBoardParams,
  FindActiveBoardByParams,
  IBoardRepository,
  PublicBoard,
  UpdateBoardParams,
} from './board-interface.repository.js';

const PUBLIC_COLUMNS =
  'id, user_id AS "userId", title, description, created_at AS "createdAt", updated_at AS "updatedAt"';

@Injectable()
export class BoardRepository implements IBoardRepository {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly repository: Repository<BoardEntity>,
  ) {}

  async create(data: CreateBoardParams): Promise<PublicBoard> {
    const { raw } = await this.repository
      .createQueryBuilder()
      .insert()
      .into(BoardEntity)
      .values({ id: uuidv7(), ...data })
      .updateEntity(false)
      .returning(PUBLIC_COLUMNS)
      .execute();

    return raw[0];
  }

  async findActiveBy(data: FindActiveBoardByParams): Promise<PublicBoard[]> {
    if (!data.columns.id && !data.columns.userId) {
      throw new Error(
        'Nenhum critério de busca fornecido. É necessário fornecer pelo menos um critério de busca.',
      );
    }

    const query = this.repository
      .createQueryBuilder('b')
      .select(PUBLIC_COLUMNS)
      .where('b.is_active = true')
      .orderBy('b.id', 'DESC');

    if (data.columns.id) {
      query.andWhere('b.id = :id', { id: data.columns.id });
    }

    if (data.columns.userId) {
      query.andWhere('b.user_id = :userId', { userId: data.columns.userId });
    }

    if (data.cursor) {
      query.andWhere('b.id < :cursor', { cursor: data.cursor });
    }

    if (data.limit) {
      query.limit(data.limit);
    }

    return await query.getRawMany<PublicBoard>();
  }

  async update(
    id: string,
    data: UpdateBoardParams,
  ): Promise<PublicBoard | null> {
    const { raw } = await this.repository
      .createQueryBuilder()
      .update(BoardEntity)
      .set(data)
      .where('id = :id AND is_active = true', { id })
      .updateEntity(false)
      .returning(PUBLIC_COLUMNS)
      .execute();

    return raw[0] ?? null;
  }

  async deactivateWithTasks(id: string): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(BoardEntity)
        .set({ isActive: false })
        .where('id = :id', { id })
        .execute();

      await manager
        .createQueryBuilder()
        .update(TaskEntity)
        .set({ isActive: false })
        .where('board_id = :id', { id })
        .execute();
    });
  }
}
