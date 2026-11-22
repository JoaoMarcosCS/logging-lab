import { stdTimeFunctions, type LoggerOptions } from 'pino';
import { env } from '../../shared/environment/env.js';

export const loggerConfig: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: { service: 'task-flow-api', env: env.ENVIRONMENT }, //texto que irá aparecer em todas as mensagens de log, irão
  //permitir identificar de qual serviço e ambiente a mensagem de log veio
  timestamp: stdTimeFunctions.isoTime, //formato de timestamp
  formatters: {
    level: (label) => ({ level: label }), //formato do nível de log, grava "level":"error" em vez de "level":50
  },
  transport:
    env.LOG_FORMAT === 'pretty'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true, //cores no log
            singleLine: true, //log em uma única linha
            translateTime: 'SYS:HH:MM:ss.l', //formato de timestamp
            ignore: 'service,env', //ignora os campos service e env no log
          },
        }
      : undefined, //no formato 'json' não há transport: o pino escreve direto no stdout, sem worker thread
};
