import {
  Controller,
  Cookies,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Throttle } from '@nestjs/throttler';
import { RefreshUseCase } from './refresh.usecase.js';
import { Public } from '../../../../shared/decorators/public.decorator.js';
import {
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '../../utils/auth-cookies.js';

@Controller('auth')
export class RefreshController {
  constructor(
    private readonly refreshUseCase: RefreshUseCase,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Cookies(REFRESH_TOKEN_COOKIE) refreshToken: string | undefined,
    @Res({ passthrough: true }) response: unknown,
  ): Promise<void> {
    const tokens = await this.refreshUseCase.execute(refreshToken);
    setAuthCookies(this.adapterHost.httpAdapter, response, tokens);
  }
}
