import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './shared/environment/env.js';
import { CORS_ORIGINS } from './infra/http/security/cors-origins.js';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Guarda os logs emitidos antes do useLogger e os reenvia pelo pino.
    // Sem ele, o começo do boot (InstanceLoader, RoutesResolver) sai no formato antigo.
    // Limite: se o boot falhar antes do useLogger, os logs saem no logger padrão do Nest.
    bufferLogs: true,
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    // Origens permitidas por ambiente.
    origin: CORS_ORIGINS[env.ENVIRONMENT],
    // Permite enviar os cookies de autenticação.
    credentials: true,
    // Deixa o navegador expor o X-Request-Id ao JavaScript, para o frontend
    // poder mostrar ou reportar o id de uma requisição que falhou.
    exposedHeaders: ['X-Request-Id'],
  });

  // Troca o logger interno do Nest pelo pino: tudo que usa Logger de @nestjs/common
  // (inclusive o RedisCacheProvider) passa a sair em JSON.
  app.useLogger(app.get(Logger));

  await app.listen(env.API_PORT);
}

await bootstrap();
