import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity.js';
import { CreateUserController } from './usecase/create/create-user.controller.js';
import { CreateUserUseCase } from './usecase/create/create-user.usecase.js';
import { GetUserController } from './usecase/get/get-user.controller.js';
import { GetUserUseCase } from './usecase/get/get-user.usecase.js';
import { UpdateUserController } from './usecase/update/update-user.controller.js';
import { UpdateUserUseCase } from './usecase/update/update-user.usecase.js';
import { UpdateUserPasswordController } from './usecase/update-password/update-user-password.controller.js';
import { UpdateUserPasswordUseCase } from './usecase/update-password/update-user-password.usecase.js';
import { DeleteUserController } from './usecase/delete/delete-user.controller.js';
import { DeleteUserUseCase } from './usecase/delete/delete-user.usecase.js';
import { UserRepository } from './repository/user.repository.js';
import { IUserRepository } from './repository/user-interface.repository.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), SessionsModule],
  controllers: [
    CreateUserController,
    GetUserController,
    UpdateUserController,
    UpdateUserPasswordController,
    DeleteUserController,
  ],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    UpdateUserPasswordUseCase,
    DeleteUserUseCase,
  ],
  exports: [IUserRepository],
})
export class UsersModule {}
