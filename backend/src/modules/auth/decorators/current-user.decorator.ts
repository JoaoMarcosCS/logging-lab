import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

export type AuthenticatedUser = {
  id: string;
  sessionId: string;
};

export type AuthenticatedRequest = {
  user?: AuthenticatedUser;
};

export const GetCurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new Error('GetCurrentUser usado em rota sem autenticação');
    }

    return request.user;
  },
);
