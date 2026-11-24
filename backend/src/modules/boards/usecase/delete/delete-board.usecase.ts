import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
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
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(DeleteBoardUseCase.name);
  }

  async execute(userId: string, boardId: string): Promise<void> {
    await this.getBoardUseCase.execute(userId, boardId);

    await this.boardRepository.deactivateWithTasks(boardId);

    await Promise.all([
      this.cacheProvider.invalidateByPrefix(cacheKeys.board(boardId)),
      this.cacheProvider.invalidateByPrefix(cacheKeys.boardsOfUser(userId)),
    ]);

    // A exclusão é lógica e leva as tarefas do board junto. O evento permite responder
    // "quem apagou este board e quando" sem consultar o banco.
    this.logger.info({ event: 'board.deleted', boardId }, 'board deleted');
  }
}
