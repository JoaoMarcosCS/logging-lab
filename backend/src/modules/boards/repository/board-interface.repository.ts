import type { BoardEntity } from '../entity/board.entity.js';

export type PublicBoard = Pick<
  BoardEntity,
  'id' | 'userId' | 'title' | 'description' | 'createdAt' | 'updatedAt'
>;

export type CreateBoardParams = Pick<
  BoardEntity,
  'userId' | 'title' | 'description'
>;

export type UpdateBoardParams = Partial<
  Pick<BoardEntity, 'title' | 'description'>
>;

export type FindActiveBoardByParams = {
  columns: Partial<Pick<BoardEntity, 'id' | 'userId'>>;
  limit?: number;
  cursor?: string;
};

export abstract class IBoardRepository {
  abstract create(data: CreateBoardParams): Promise<PublicBoard>;
  abstract findActiveBy(data: FindActiveBoardByParams): Promise<PublicBoard[]>;
  abstract update(
    id: string,
    data: UpdateBoardParams,
  ): Promise<PublicBoard | null>;
  abstract deactivateWithTasks(id: string): Promise<void>;
}
