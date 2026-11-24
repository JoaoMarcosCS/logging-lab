import { ListBoardsUseCase } from './list-boards.usecase.js';
import type { PinoLogger } from 'nestjs-pino';
import type { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  mockLogger,
  makeBoard,
  mockBoardRepository,
  mockCacheProvider,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import {
  CACHE_TTL_SECONDS,
  cacheKeys,
} from '../../../../shared/utils/cache-keys.js';

const boards = ['3', '2', '1'].map((n) =>
  makeBoard({ id: `01970000-0000-7000-8000-00000000000${n}` }),
);

describe('ListBoardsUseCase', () => {
  let repository: Mocked<IBoardRepository>;
  let cache: Mocked<ICacheProvider>;
  let logger: MockedLogger;
  let useCase: ListBoardsUseCase;

  beforeEach(() => {
    repository = mockBoardRepository();
    cache = mockCacheProvider();
    logger = mockLogger();
    useCase = new ListBoardsUseCase(
      repository,
      cache as unknown as ICacheProvider,
      logger as unknown as PinoLogger,
    );
  });

  it('returns a page with the next cursor and caches it', async () => {
    repository.findActiveBy.mockResolvedValue(boards);

    const page = await useCase.execute(USER_ID, { limit: 2 });

    expect(page).toEqual({
      data: boards.slice(0, 2),
      nextCursor: boards[1].id,
    });
    expect(repository.findActiveBy).toHaveBeenCalledWith({
      columns: { userId: USER_ID },
      limit: 3,
      cursor: undefined,
    });
    expect(cache.set).toHaveBeenCalledWith(
      cacheKeys.boardsPage(USER_ID, 2),
      page,
      CACHE_TTL_SECONDS,
    );
  });

  it('returns a null cursor on the last page', async () => {
    repository.findActiveBy.mockResolvedValue(boards.slice(0, 1));

    await expect(useCase.execute(USER_ID, { limit: 2 })).resolves.toEqual({
      data: boards.slice(0, 1),
      nextCursor: null,
    });
  });

  it('returns the cached page', async () => {
    const page = { data: boards, nextCursor: null };
    cache.get.mockResolvedValue(page);

    await expect(
      useCase.execute(USER_ID, { limit: 20, cursor: boards[0].id }),
    ).resolves.toEqual(page);
    expect(cache.get).toHaveBeenCalledWith(
      cacheKeys.boardsPage(USER_ID, 20, boards[0].id),
    );
    expect(repository.findActiveBy).not.toHaveBeenCalled();
  });
});
