import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Throttle } from '@nestjs/throttler';
import { LoginSchema } from './login.schema.js';
import type { LoginData } from './login.schema.js';
import { LoginUseCase } from './login.usecase.js';
import { Public } from '../../../../shared/decorators/public.decorator.js';
import { setAuthCookies } from '../../utils/auth-cookies.js';

@Controller('auth')
export class LoginController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Body({ schema: LoginSchema }) body: LoginData,
    @Res({ passthrough: true }) response: unknown,
  ): Promise<void> {
    const tokens = await this.loginUseCase.execute(body);
    setAuthCookies(this.adapterHost.httpAdapter, response, tokens);
  }
}
