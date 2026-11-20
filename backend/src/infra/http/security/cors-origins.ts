import type { Env } from '../../../shared/environment/env.js';

export const CORS_ORIGINS: Record<Env['ENVIRONMENT'], string[]> = {
  local: ['http://localhost:3000', 'http://localhost:5173'],
  test: [],
  development: [],
  production: [],
};
