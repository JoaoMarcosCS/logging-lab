import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateUserSchema } from './create-user.schema.js';
import type { CreateUserData } from './create-user.schema.js';
import { CreateUserUseCase } from './create-user.usecase.js';
import type { PublicUser } from '../../repository/user-interface.repository.js';
import { Public } from '../../../../shared/decorators/public.decorator.js';

@Controller('users')
export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(
    @Body({ schema: CreateUserSchema }) body: CreateUserData,
  ): Promise<PublicUser> {
    return await this.createUserUseCase.execute(body);
  }
}
