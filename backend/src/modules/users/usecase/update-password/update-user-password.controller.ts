import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { UpdateUserPasswordSchema } from './update-user-password.schema.js';
import type { UpdateUserPasswordData } from './update-user-password.schema.js';
import { UpdateUserPasswordUseCase } from './update-user-password.usecase.js';
import { GetCurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../auth/decorators/current-user.decorator.js';
import { clearAuthCookies } from '../../../auth/utils/auth-cookies.js';

@Controller('users')
export class UpdateUserPasswordController {
  constructor(
    private readonly updateUserPasswordUseCase: UpdateUserPasswordUseCase,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Body({ schema: UpdateUserPasswordSchema }) body: UpdateUserPasswordData,
    @Res({ passthrough: true }) response: unknown,
  ): Promise<void> {
    await this.updateUserPasswordUseCase.execute(user.id, body);
    clearAuthCookies(this.adapterHost.httpAdapter, response);
  }
}
