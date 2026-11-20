import { Injectable } from '@nestjs/common';
import { IBoardRepository } from '../../repository/board-interface.repository.js';
import { GetBoardUseCase } from '../get/get-board.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class DeleteBoardUseCase {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly getBoardUseCase: GetBoardUseCase,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(userId: string, boardId: string): Promise<void> {
    await this.getBoardUseCase.execute(userId, boardId);

    await this.boardRepository.deactivateWithTasks(boardId);

    await Promise.all([
      this.cacheProvider.invalidateByPrefix(cacheKeys.board(boardId)),
      this.cacheProvider.invalidateByPrefix(cacheKeys.boardsOfUser(userId)),
    ]);
  }
}
