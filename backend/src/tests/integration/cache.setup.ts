import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { RedisCacheProvider } from '../../infra/cache/redis-cache.provider.js';
import { env } from '../../shared/environment/env.js';

let provider: RedisCacheProvider | undefined;

export function cacheProvider(): RedisCacheProvider {
  if (!provider) {
    throw new Error('cache provider not initialized');
  }
  return provider;
}

export async function waitUntilReady(
  instance: RedisCacheProvider,
  timeoutMs = 10000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!instance.isReady) {
    if (Date.now() > deadline) {
      throw new Error('redis connection timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

beforeAll(async () => {
  env.REDIS_HOST = inject('redisHost');
  env.REDIS_PORT = inject('redisPort');

  provider = new RedisCacheProvider();
  provider.onModuleInit();
  await waitUntilReady(provider);
});

afterAll(async () => {
  await provider?.onApplicationShutdown();
  provider = undefined;
});

beforeEach(async () => {
  await provider?.invalidateByPrefix('');
});
