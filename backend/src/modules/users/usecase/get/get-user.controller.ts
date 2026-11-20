import { Controller, Get } from '@nestjs/common';
import { GetUserUseCase } from './get-user.usecase.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';

@Controller('users')
export class GetUserController {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  @Get('me')
  async handle(@GetCurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return await this.getUserUseCase.execute(user.id);
  }
}
