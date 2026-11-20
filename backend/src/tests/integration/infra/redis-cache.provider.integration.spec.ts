import { describe, expect, it } from 'vitest';
import { RedisCacheProvider } from '../../../infra/cache/redis-cache.provider.js';
import { env } from '../../../shared/environment/env.js';
import { cacheProvider, waitUntilReady } from '../cache.setup.js';

describe('RedisCacheProvider', () => {
  describe('set and get', () => {
    it('stores and returns a json value', async () => {
      const value = { id: 'user-1', roles: ['admin'], active: true };

      await cacheProvider().set('user:1', value);

      expect(await cacheProvider().get('user:1')).toEqual(value);
    });

    it('returns null for a missing key', async () => {
      expect(await cacheProvider().get('missing')).toBeNull();
    });

    it('expires the key after the ttl', async () => {
      await cacheProvider().set('session', 'value', 1);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(await cacheProvider().get('session')).toBeNull();
    });

    it('overwrites an existing key', async () => {
      await cacheProvider().set('key', 'first');
      await cacheProvider().set('key', 'second');

      expect(await cacheProvider().get('key')).toBe('second');
    });
  });

  describe('getAndDelete', () => {
    it('returns the value and removes the key', async () => {
      await cacheProvider().set('session:1', 'user-1');

      expect(await cacheProvider().getAndDelete('session:1')).toBe('user-1');
      expect(await cacheProvider().get('session:1')).toBeNull();
    });

    it('returns null for a missing key', async () => {
      expect(await cacheProvider().getAndDelete('missing')).toBeNull();
    });

    it('returns the value to only one of concurrent callers', async () => {
      await cacheProvider().set('session:race', 'user-1');

      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          cacheProvider().getAndDelete('session:race'),
        ),
      );

      expect(results.filter((result) => result !== null)).toEqual(['user-1']);
    });
  });

  describe('invalidate', () => {
    it('removes the key', async () => {
      await cacheProvider().set('key', 'value');

      await cacheProvider().invalidate('key');

      expect(await cacheProvider().get('key')).toBeNull();
    });

    it('does nothing for a missing key', async () => {
      await expect(
        cacheProvider().invalidate('missing'),
      ).resolves.toBeUndefined();
    });
  });

  describe('invalidateByPrefix', () => {
    it('removes only the keys with the prefix', async () => {
      await cacheProvider().set('tasks:1', 'a');
      await cacheProvider().set('tasks:2', 'b');
      await cacheProvider().set('users:1', 'c');

      await cacheProvider().invalidateByPrefix('tasks:');

      expect(await cacheProvider().get('tasks:1')).toBeNull();
      expect(await cacheProvider().get('tasks:2')).toBeNull();
      expect(await cacheProvider().get('users:1')).toBe('c');
    });

    it('removes keys across multiple scan batches', async () => {
      await Promise.all(
        Array.from({ length: 250 }, (_, index) =>
          cacheProvider().set(`bulk:${index}`, index),
        ),
      );

      await cacheProvider().invalidateByPrefix('bulk:');

      expect(await cacheProvider().get('bulk:0')).toBeNull();
      expect(await cacheProvider().get('bulk:249')).toBeNull();
    });
  });

  describe('when redis is unavailable', () => {
    it('fails open without throwing', async () => {
      const port = env.REDIS_PORT;
      env.REDIS_PORT = 1;
      const offline = new RedisCacheProvider();
      env.REDIS_PORT = port;

      await expect(offline.set('key', 'value')).resolves.toBeUndefined();
      await expect(offline.get('key')).resolves.toBeNull();
      await expect(offline.getAndDelete('key')).resolves.toBeNull();
      await expect(offline.invalidate('key')).resolves.toBeUndefined();
      await expect(offline.invalidateByPrefix('key')).resolves.toBeUndefined();
    });

    it('closes the connection on shutdown', async () => {
      const instance = new RedisCacheProvider();
      instance.onModuleInit();
      await waitUntilReady(instance);

      await instance.onApplicationShutdown();

      expect(instance.isReady).toBe(false);
      await expect(instance.get('key')).resolves.toBeNull();
    });
  });
});
