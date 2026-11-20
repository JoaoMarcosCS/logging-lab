import { Injectable } from '@nestjs/common';
import { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import type { ListBoardsData } from './list-boards.schema.js';
import { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';
import { paginate } from '../../../../shared/utils/paginate.js';
import type { Paginated } from '../../../../shared/utils/paginate.js';

@Injectable()
export class ListBoardsUseCase {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(
    userId: string,
    data: ListBoardsData,
  ): Promise<Paginated<PublicBoard>> {
    const key = cacheKeys.boardsPage(userId, data.limit, data.cursor);
    const cached = await this.cacheProvider.get<Paginated<PublicBoard>>(key);

    if (cached) {
      return cached;
    }

    const boards = await this.boardRepository.findActiveBy({
      columns: { userId },
      limit: data.limit + 1,
      cursor: data.cursor,
    });
    const page = paginate(boards, data.limit);

    await this.cacheProvider.set(key, page, CACHE_TTL_SECONDS);

    return page;
  }
}
