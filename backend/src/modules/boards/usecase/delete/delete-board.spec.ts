import { NotFoundException } from '@nestjs/common';
import { DeleteBoardUseCase } from './delete-board.usecase.js';
import type { GetBoardUseCase } from '../get/get-board.usecase.js';
import type { IBoardRepository } from '../../repository/board-interface.repository.js';
import type { ICacheProvider } from '../../../../infra/cache/cache-interface.provider.js';
import {
  BOARD_ID,
  makeBoard,
  mockBoardRepository,
  mockCacheProvider,
  USER_ID,
} from '../../../../tests/mocks/index.js';
import type { Mocked } from '../../../../tests/mocks/index.js';
import { cacheKeys } from '../../../../shared/utils/cache-keys.js';

describe('DeleteBoardUseCase', () => {
  let repository: Mocked<IBoardRepository>;
  let cache: Mocked<ICacheProvider>;
  let getBoard: { execute: ReturnType<typeof vi.fn> };
  let useCase: DeleteBoardUseCase;

  beforeEach(() => {
    repository = mockBoardRepository();
    cache = mockCacheProvider();
    getBoard = { execute: vi.fn().mockResolvedValue(makeBoard()) };
    useCase = new DeleteBoardUseCase(
      repository,
      getBoard as unknown as GetBoardUseCase,
      cache as unknown as ICacheProvider,
    );
  });

  it('deactivates the board with its tasks and clears every related cache', async () => {
    await useCase.execute(USER_ID, BOARD_ID);

    expect(repository.deactivateWithTasks).toHaveBeenCalledWith(BOARD_ID);
    expect(cache.invalidateByPrefix).toHaveBeenCalledWith(
      cacheKeys.board(BOARD_ID),
    );
    expect(cache.invalidateByPrefix).toHaveBeenCalledWith(
      cacheKeys.boardsOfUser(USER_ID),
    );
  });

  it('does not delete a board the user cannot access', async () => {
    getBoard.execute.mockRejectedValue(new NotFoundException());

    await expect(useCase.execute(USER_ID, BOARD_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.deactivateWithTasks).not.toHaveBeenCalled();
  });
});
