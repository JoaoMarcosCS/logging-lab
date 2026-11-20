import { Controller, Get, Param } from '@nestjs/common';
import { BoardIdParamSchema } from './get-board.schema.js';
import { GetBoardUseCase } from './get-board.usecase.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards')
export class GetBoardController {
  constructor(private readonly getBoardUseCase: GetBoardUseCase) {}

  @Get(':id')
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', { schema: BoardIdParamSchema }) id: string,
  ): Promise<PublicBoard> {
    return await this.getBoardUseCase.execute(user.id, id);
  }
}
