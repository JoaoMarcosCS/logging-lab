import type { HttpServer } from '@nestjs/common';
import type { CookieSerializeOptions } from '@nestjs/common';
import { env } from '../../../shared/environment/env.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const SECURE = env.ENVIRONMENT !== 'local' && env.ENVIRONMENT !== 'test';

const baseOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: SECURE,
};

const accessOptions: CookieSerializeOptions = { ...baseOptions, path: '/' };

const refreshOptions: CookieSerializeOptions = {
  ...baseOptions,
  path: '/api/v1/auth',
};

export function setAuthCookies(
  adapter: HttpServer,
  response: unknown,
  tokens: AuthTokens,
): void {
  adapter.setCookie?.(response, ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...accessOptions,
    maxAge: env.JWT_ACCESS_TTL,
  });
  adapter.setCookie?.(response, REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...refreshOptions,
    maxAge: env.JWT_REFRESH_TTL,
  });
}

export function clearAuthCookies(adapter: HttpServer, response: unknown): void {
  adapter.clearCookie?.(response, ACCESS_TOKEN_COOKIE, accessOptions);
  adapter.clearCookie?.(response, REFRESH_TOKEN_COOKIE, refreshOptions);
}
