import { Injectable } from '@nestjs/common';
import { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import type { CreateBoardData } from './create-board.schema.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class CreateBoardUseCase {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(userId: string, data: CreateBoardData): Promise<PublicBoard> {
    const board = await this.boardRepository.create({
      userId,
      title: data.title,
      description: data.description ?? null,
    });

    await this.cacheProvider.invalidateByPrefix(cacheKeys.boardsOfUser(userId));

    return board;
  }
}
