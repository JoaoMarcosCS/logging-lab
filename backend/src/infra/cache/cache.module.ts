import { Global, Module } from '@nestjs/common';
import { ICacheProvider } from './cache-interface.provider.js';
import { RedisCacheProvider } from './redis-cache.provider.js';

@Global()
@Module({
  providers: [{ provide: ICacheProvider, useClass: RedisCacheProvider }],
  exports: [ICacheProvider],
})
export class CacheModule {}
