import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './shared/decorators/public.decorator.js';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class AppController {
  @Public()
  @SkipThrottle()
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
