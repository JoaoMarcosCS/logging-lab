import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import {
  AppDataSource,
  dataSourceOptions,
} from './infra/database/data-source.js';
import { CacheModule } from './infra/cache/cache.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BoardsModule } from './modules/boards/boards.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { LoggerModule } from './infra/logger/logger.module.js';
import { HttpExceptionFilter } from './infra/http/filters/http-exception.filter.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions,
      dataSourceFactory: async () => {
        return AppDataSource;
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CacheModule,
    UsersModule,
    AuthModule,
    BoardsModule,
    TasksModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new StandardSchemaValidationPipe(),
    },
  ],
})
export class AppModule {}
