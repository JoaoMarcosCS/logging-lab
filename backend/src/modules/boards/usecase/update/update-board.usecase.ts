import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import type { UpdateBoardData } from './update-board.schema.js';
import { GetBoardUseCase } from '../get/get-board.usecase.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import { MessageError } from '../../../../shared/enums/errors.enum.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

@Injectable()
export class UpdateBoardUseCase {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly getBoardUseCase: GetBoardUseCase,
    private readonly cacheProvider: ICacheProvider,
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(UpdateBoardUseCase.name);
  }

  async execute(
    userId: string,
    boardId: string,
    data: UpdateBoardData,
  ): Promise<PublicBoard> {
    //para reaproveitar a validação de se o board existe e se pertence ao usuário
    await this.getBoardUseCase.execute(userId, boardId);

    const board = await this.boardRepository.update(boardId, data);

    if (!board) {
      throw new NotFoundException(MessageError.BOARD_NOT_FOUND);
    }

    await Promise.all([
      this.cacheProvider.invalidate(cacheKeys.board(boardId)),
      this.cacheProvider.invalidateByPrefix(cacheKeys.boardsOfUser(userId)),
    ]);

    // Registra quais campos mudaram, sem os valores: título e descrição são conteúdo do usuário.
    this.logger.info(
      { event: 'board.updated', boardId, changedFields: Object.keys(data) },
      'board updated',
    );

    return board;
  }
}
