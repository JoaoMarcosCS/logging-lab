import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { loggerConfig } from './logger.config.js';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        ...loggerConfig,
        autoLogging: false, //desabilita o log automático de requisições HTTP, para que possamos customizar o log
        serializers: {
          req: (req: { id: unknown; method: string; url: string }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
        },
      },
    }),
  ],
})
export class LoggerModule {}
