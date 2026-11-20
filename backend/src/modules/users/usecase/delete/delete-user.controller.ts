import { Controller, Delete, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DeleteUserUseCase } from './delete-user.usecase.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';
import { clearAuthCookies } from '../../../auth/utils/auth-cookies.js';

@Controller('users')
export class DeleteUserController {
  constructor(
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: unknown,
  ): Promise<void> {
    await this.deleteUserUseCase.execute(user.id);
    clearAuthCookies(this.adapterHost.httpAdapter, response);
  }
}
