import { Body, Controller, Patch } from '@nestjs/common';
import { UpdateUserSchema } from './update-user.schema.js';
import type { UpdateUserData } from './update-user.schema.js';
import { UpdateUserUseCase } from './update-user.usecase.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('users')
export class UpdateUserController {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  @Patch('me')
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Body({ schema: UpdateUserSchema }) body: UpdateUserData,
  ): Promise<PublicUser> {
    return await this.updateUserUseCase.execute(user.id, body);
  }
}
