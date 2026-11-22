import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './shared/environment/env.js';
import { CORS_ORIGINS } from './infra/http/security/cors-origins.js';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // guarda os logs que vieram antes do pino subir. Sem ele, o começo do boot sai no formato antigo.
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({ origin: CORS_ORIGINS[env.ENVIRONMENT], credentials: true });

  app.useLogger(app.get(Logger));

  await app.listen(env.API_PORT);
}

await bootstrap();
