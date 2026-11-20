import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from './entity/board.entity.js';
import { BoardRepository } from './repository/board.repository.js';
import { IBoardRepository } from './repository/board-interface.repository.js';
import { CreateBoardController } from './usecase/create/create-board.controller.js';
import { CreateBoardUseCase } from './usecase/create/create-board.usecase.js';
import { ListBoardsController } from './usecase/list/list-boards.controller.js';
import { ListBoardsUseCase } from './usecase/list/list-boards.usecase.js';
import { GetBoardController } from './usecase/get/get-board.controller.js';
import { GetBoardUseCase } from './usecase/get/get-board.usecase.js';
import { UpdateBoardController } from './usecase/update/update-board.controller.js';
import { UpdateBoardUseCase } from './usecase/update/update-board.usecase.js';
import { DeleteBoardController } from './usecase/delete/delete-board.controller.js';
import { DeleteBoardUseCase } from './usecase/delete/delete-board.usecase.js';

@Module({
  imports: [TypeOrmModule.forFeature([BoardEntity])],
  controllers: [
    CreateBoardController,
    ListBoardsController,
    GetBoardController,
    UpdateBoardController,
    DeleteBoardController,
  ],
  providers: [
    { provide: IBoardRepository, useClass: BoardRepository },
    CreateBoardUseCase,
    ListBoardsUseCase,
    GetBoardUseCase,
    UpdateBoardUseCase,
    DeleteBoardUseCase,
  ],
  exports: [GetBoardUseCase],
})
export class BoardsModule {}
