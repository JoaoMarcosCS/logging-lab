import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const envFilePath = join(import.meta.dirname, '../../../.env');

if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

const envSchema = z.object({
  API_PORT: z.coerce.number().int().positive(),
  NODE_VERSION: z.string(),
  ENVIRONMENT: z.enum(['development', 'production', 'test', 'local']),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string(),
  DB_PASS: z.string(),
  DB_NAME: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().int().positive(),
  JWT_REFRESH_TTL: z.coerce.number().int().positive(),
  // Nível mínimo de log. 'silent' desliga tudo (usado nos testes).
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  // 'pretty' para ler no terminal em dev; 'json' para containers e coletores.
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env: Env = parsed.data;
