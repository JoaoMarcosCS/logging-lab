import { Injectable, NotFoundException } from '@nestjs/common';
import { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class GetBoardUseCase {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(userId: string, boardId: string): Promise<PublicBoard> {
    const key = cacheKeys.board(boardId);
    let board = await this.cacheProvider.get<PublicBoard>(key);

    if (!board) {
      [board] = await this.boardRepository.findActiveBy({
        columns: { id: boardId },
      });

      if (board) {
        await this.cacheProvider.set(key, board, CACHE_TTL_SECONDS);
      }
    }

    if (!board || board.userId !== userId) {
      throw new NotFoundException(MessageError.BOARD_NOT_FOUND);
    }

    return board;
  }
}
