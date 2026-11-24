import { CreateBoardUseCase } from './create-board.usecase.js';
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
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

describe('CreateBoardUseCase', () => {
  let repository: Mocked<IBoardRepository>;
  let cache: Mocked<ICacheProvider>;
  let logger: MockedLogger;
  let useCase: CreateBoardUseCase;

  beforeEach(() => {
    repository = mockBoardRepository();
    cache = mockCacheProvider();
    logger = mockLogger();
    useCase = new CreateBoardUseCase(
      repository,
      cache as unknown as ICacheProvider,
      logger as unknown as PinoLogger,
    );
  });

  it('creates the board for the user and invalidates their board lists', async () => {
    const board = makeBoard();
    repository.create.mockResolvedValue(board);

    await expect(
      useCase.execute(USER_ID, { title: 'Estudos' }),
    ).resolves.toEqual(board);
    expect(repository.create).toHaveBeenCalledWith({
      userId: USER_ID,
      title: 'Estudos',
      description: null,
    });
    expect(cache.invalidateByPrefix).toHaveBeenCalledWith(
      cacheKeys.boardsOfUser(USER_ID),
    );
  });
});
