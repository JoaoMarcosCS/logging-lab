import { Controller, Get, Query } from '@nestjs/common';
import { ListBoardsSchema } from './list-boards.schema.js';
import type { ListBoardsData } from './list-boards.schema.js';
import { ListBoardsUseCase } from './list-boards.usecase.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';
import type { Paginated } from '../../../../shared/utils/paginate.js';

@Controller('boards')
export class ListBoardsController {
  constructor(private readonly listBoardsUseCase: ListBoardsUseCase) {}

  @Get()
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Query({ schema: ListBoardsSchema }) query: ListBoardsData,
  ): Promise<Paginated<PublicBoard>> {
    return await this.listBoardsUseCase.execute(user.id, query);
  }
}
