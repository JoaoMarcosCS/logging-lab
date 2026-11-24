import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { UpdateBoardUseCase } from './update-board.usecase.js';
import type { GetBoardUseCase } from '../get/get-board.usecase.js';
import type { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  mockLogger,
  BOARD_ID,
  makeBoard,
  mockBoardRepository,
  mockCacheProvider,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked, MockedLogger } from '../../../../tests/mocks/index.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

describe('UpdateBoardUseCase', () => {
  let repository: Mocked<IBoardRepository>;
  let cache: Mocked<ICacheProvider>;
  let getBoard: { execute: ReturnType<typeof vi.fn> };
  let logger: MockedLogger;
  let useCase: UpdateBoardUseCase;

  beforeEach(() => {
    repository = mockBoardRepository();
    cache = mockCacheProvider();
    getBoard = { execute: vi.fn().mockResolvedValue(makeBoard()) };
    logger = mockLogger();
    useCase = new UpdateBoardUseCase(
      repository,
      getBoard as unknown as GetBoardUseCase,
      cache as unknown as ICacheProvider,
      logger as unknown as PinoLogger,
    );
  });

  it('updates the board and invalidates its detail and the user lists', async () => {
    const updated = makeBoard({ title: 'Novo' });
    repository.update.mockResolvedValue(updated);

    await expect(
      useCase.execute(USER_ID, BOARD_ID, { title: 'Novo' }),
    ).resolves.toEqual(updated);
    expect(getBoard.execute).toHaveBeenCalledWith(USER_ID, BOARD_ID);
    expect(cache.invalidate).toHaveBeenCalledWith(cacheKeys.board(BOARD_ID));
    expect(cache.invalidateByPrefix).toHaveBeenCalledWith(
      cacheKeys.boardsOfUser(USER_ID),
    );
  });

  it('does not update a board the user cannot access', async () => {
    getBoard.execute.mockRejectedValue(new NotFoundException());

    await expect(
      useCase.execute(USER_ID, BOARD_ID, { title: 'Novo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the board was deleted meanwhile', async () => {
    repository.update.mockResolvedValue(null);

    await expect(
      useCase.execute(USER_ID, BOARD_ID, { title: 'Novo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(cache.invalidate).not.toHaveBeenCalled();
  });
});
