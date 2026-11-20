import { Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { LogoutUseCase } from './logout.usecase.js';
import { GetCurrentUser } from '../../decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../decorators/current-user.decorator.js';
import { clearAuthCookies } from '../../utils/auth-cookies.js';

@Controller('auth')
export class LogoutController {
  constructor(
    private readonly logoutUseCase: LogoutUseCase,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @GetCurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: unknown,
  ): Promise<void> {
    await this.logoutUseCase.execute(user);
    clearAuthCookies(this.adapterHost.httpAdapter, response);
  }
}
