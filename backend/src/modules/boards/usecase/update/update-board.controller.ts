import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdateBoardSchema } from './update-board.schema.js';
import type { UpdateBoardData } from './update-board.schema.js';
import { UpdateBoardUseCase } from './update-board.usecase.js';
import { BoardIdParamSchema } from '../get/get-board.schema.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards')
export class UpdateBoardController {
  constructor(private readonly updateBoardUseCase: UpdateBoardUseCase) {}

  @Patch(':id')
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', { schema: BoardIdParamSchema }) id: string,
    @Body({ schema: UpdateBoardSchema }) body: UpdateBoardData,
  ): Promise<PublicBoard> {
    return await this.updateBoardUseCase.execute(user.id, id, body);
  }
}
