import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import type { StartedRedisContainer } from '@testcontainers/redis';
import type { TestProject } from 'vitest/node';

let postgres: StartedPostgreSqlContainer;
let redis: StartedRedisContainer;

export async function setup(project: TestProject) {
  [postgres, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new RedisContainer('redis:7-alpine').start(),
  ]);

  project.provide('pgConnectionUri', postgres.getConnectionUri());
  project.provide('redisHost', redis.getHost());
  project.provide('redisPort', redis.getPort());
}

export async function teardown() {
  await Promise.all([postgres?.stop(), redis?.stop()]);
}

declare module 'vitest' {
  interface ProvidedContext {
    pgConnectionUri: string;
    redisHost: string;
    redisPort: number;
  }
}
