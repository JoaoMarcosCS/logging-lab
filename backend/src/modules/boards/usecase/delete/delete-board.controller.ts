import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { DeleteBoardUseCase } from './delete-board.usecase.js';
import { BoardIdParamSchema } from '../get/get-board.schema.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards')
export class DeleteBoardController {
  constructor(private readonly deleteBoardUseCase: DeleteBoardUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', { schema: BoardIdParamSchema }) id: string,
  ): Promise<void> {
    await this.deleteBoardUseCase.execute(user.id, id);
  }
}
