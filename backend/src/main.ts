import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './shared/environment/env.js';
import { CORS_ORIGINS } from './infra/http/security/cors-origins.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({ origin: CORS_ORIGINS[env.ENVIRONMENT], credentials: true });

  await app.listen(env.API_PORT);
}

await bootstrap();
