import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
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
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(GetBoardUseCase.name);
  }

  async execute(userId: string, boardId: string): Promise<PublicBoard> {
    const key = cacheKeys.board(boardId);
    let board = await this.cacheProvider.get<PublicBoard>(key);
    // Guardado antes da busca no banco, que reaproveita a variável board.
    const cacheHit = board !== null;

    if (!board) {
      [board] = await this.boardRepository.findActiveBy({
        columns: { id: boardId },
      });

      if (board) {
        await this.cacheProvider.set(key, board, CACHE_TTL_SECONDS);
      }
    }

    // O board existe, mas é de outro usuário. A resposta é a mesma de "não encontrado",
    // para não revelar que o id existe; o log separa os casos. Muitos desses eventos
    // para o mesmo usuário indicam alguém testando ids de outros usuários.
    if (board && board.userId !== userId) {
      this.logger.warn(
        { event: 'board.access_denied', boardId },
        'board access denied',
      );
      throw new NotFoundException(MessageError.BOARD_NOT_FOUND);
    }

    if (!board) {
      throw new NotFoundException(MessageError.BOARD_NOT_FOUND);
    }

    // Leitura: só em debug (LOG_LEVEL=debug). O access log já registra a requisição;
    // aqui fica só o que ele não mostra, se a resposta veio do cache.
    this.logger.debug({ boardId, cacheHit }, 'board loaded');

    return board;
  }
}
