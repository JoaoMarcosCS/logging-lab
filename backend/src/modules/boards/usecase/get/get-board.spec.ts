import { NotFoundException } from '@nestjs/common';
import { GetBoardUseCase } from './get-board.usecase.js';
import type { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  BOARD_ID,
  makeBoard,
  mockBoardRepository,
  mockCacheProvider,
  OTHER_USER_ID,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked } from '../../../../tests/mocks/index.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';

describe('GetBoardUseCase', () => {
  let repository: Mocked<IBoardRepository>;
  let cache: Mocked<ICacheProvider>;
  let useCase: GetBoardUseCase;

  beforeEach(() => {
    repository = mockBoardRepository();
    cache = mockCacheProvider();
    useCase = new GetBoardUseCase(
      repository,
      cache as unknown as ICacheProvider,
    );
  });

  it('returns the cached board without hitting the repository', async () => {
    const board = makeBoard();
    cache.get.mockResolvedValue(board);

    await expect(useCase.execute(USER_ID, BOARD_ID)).resolves.toEqual(board);
    expect(cache.get).toHaveBeenCalledWith(cacheKeys.board(BOARD_ID));
    expect(repository.findActiveBy).not.toHaveBeenCalled();
  });

  it('loads from the repository and caches on a miss', async () => {
    const board = makeBoard();
    repository.findActiveBy.mockResolvedValue([board]);

    await expect(useCase.execute(USER_ID, BOARD_ID)).resolves.toEqual(board);
    expect(repository.findActiveBy).toHaveBeenCalledWith({
      columns: { id: BOARD_ID },
    });
    expect(cache.set).toHaveBeenCalledWith(
      cacheKeys.board(BOARD_ID),
      board,
      CACHE_TTL_SECONDS,
    );
  });

  it('throws NotFoundException when the board belongs to another user', async () => {
    cache.get.mockResolvedValue(makeBoard({ userId: OTHER_USER_ID }));

    await expect(useCase.execute(USER_ID, BOARD_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the board does not exist or was deleted', async () => {
    repository.findActiveBy.mockResolvedValue([]);

    await expect(useCase.execute(USER_ID, BOARD_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(cache.set).not.toHaveBeenCalled();
  });
});
