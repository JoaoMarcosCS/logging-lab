import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { createClient } from 'redis';
import { env } from '../../shared/environment/env.js';
import { ICacheProvider } from './cache-interface.provider.js';

const DEFAULT_TTL_SECONDS = 60;
const MAX_RECONNECT_DELAY_MS = 5000;

@Injectable()
export class RedisCacheProvider
  implements ICacheProvider, OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisCacheProvider.name);

  private readonly client = createClient({
    socket: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      reconnectStrategy: (retries) =>
        Math.min(100 * 2 ** retries, MAX_RECONNECT_DELAY_MS),
    },
  });

  onModuleInit() {
    this.client.on('error', (err) =>
      this.logger.error({ msg: 'redis connection error', err }),
    );
    this.client.on('reconnecting', () =>
      this.logger.warn('redis reconnecting'),
    );
    this.client.on('ready', () =>
      this.logger.log('redis connection established'),
    );
    this.client
      .connect()
      .catch((err) => this.logger.error({ msg: 'redis connect failed', err }));
  }

  async onApplicationShutdown() {
    if (this.client.isOpen) {
      await this.client.close();
    }
  }

  get isReady(): boolean {
    return this.client.isReady;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client.isReady) return null;

    try {
      const raw = await this.client.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (err) {
      this.logger.error({ msg: 'cache get failed', key, err });
      return null;
    }
  }

  async getAndDelete<T>(key: string): Promise<T | null> {
    if (!this.client.isReady) return null;

    try {
      const raw = await this.client.getDel(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (err) {
      this.logger.error({ msg: 'cache getAndDelete failed', key, err });
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    if (!this.client.isReady) return;

    try {
      await this.client.set(key, JSON.stringify(value), {
        expiration: { type: 'EX', value: ttlSeconds },
      });
    } catch (err) {
      this.logger.error({ msg: 'cache set failed', key, err });
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!this.client.isReady) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error({ msg: 'cache invalidate failed', key, err });
    }
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    if (!this.client.isReady) return;
    try {
      for await (const keys of this.client.scanIterator({
        MATCH: `${prefix}*`,
        COUNT: 100,
      })) {
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      }
    } catch (err) {
      this.logger.error({
        msg: 'cache invalidateByPrefix failed',
        prefix,
        err,
      });
    }
  }
}
