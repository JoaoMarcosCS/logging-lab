import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { TokenService } from './token/token.service.js';
import { AuthGuard } from './guard/auth.guard.js';
import { LoginController } from './usecase/login/login.controller.js';
import { LoginUseCase } from './usecase/login/login.usecase.js';
import { RefreshController } from './usecase/refresh/refresh.controller.js';
import { RefreshUseCase } from './usecase/refresh/refresh.usecase.js';
import { LogoutController } from './usecase/logout/logout.controller.js';
import { LogoutUseCase } from './usecase/logout/logout.usecase.js';

@Module({
  imports: [JwtModule.register({}), UsersModule, SessionsModule],
  controllers: [LoginController, RefreshController, LogoutController],
  providers: [
    TokenService,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
