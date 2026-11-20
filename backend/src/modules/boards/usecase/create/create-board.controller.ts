import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateBoardSchema } from './create-board.schema.js';
import type { CreateBoardData } from './create-board.schema.js';
import { CreateBoardUseCase } from './create-board.usecase.js';
import type { PublicBoard } from '../../repository/board-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('boards')
export class CreateBoardController {
  constructor(private readonly createBoardUseCase: CreateBoardUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Body({ schema: CreateBoardSchema }) body: CreateBoardData,
  ): Promise<PublicBoard> {
    return await this.createBoardUseCase.execute(user.id, body);
  }
}
