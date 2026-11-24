import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
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
    private readonly logger: PinoLogger,
  ) {
    // Preenche o campo "context" de cada linha, para filtrar logs por classe.
    this.logger.setContext(CreateBoardUseCase.name);
  }

  async execute(userId: string, data: CreateBoardData): Promise<PublicBoard> {
    const board = await this.boardRepository.create({
      userId,
      title: data.title,
      description: data.description ?? null,
    });

    await this.cacheProvider.invalidateByPrefix(cacheKeys.boardsOfUser(userId));

    // Evento de domínio: só o id. Título e descrição são conteúdo do usuário e ficam fora do log.
    // O userId não é repetido aqui: o AuthGuard já o colocou no contexto de todos os logs da requisição.
    this.logger.info(
      { event: 'board.created', boardId: board.id },
      'board created',
    );

    return board;
  }
}
