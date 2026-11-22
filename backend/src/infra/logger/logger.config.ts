import { stdTimeFunctions, type LoggerOptions } from 'pino';
import { env } from '../../shared/environment/env.js';

export const loggerConfig: LoggerOptions = {
  // Nível mínimo registrado. Abaixo dele a chamada vira no-op, sem custo de serialização.
  level: env.LOG_LEVEL,

  // Campos fixos em toda linha. Substituem pid e hostname, que o pino coloca por padrão.
  // Permitem filtrar por serviço e ambiente quando vários apps mandam logs para o mesmo lugar.
  base: { service: 'task-flow-api', env: env.ENVIRONMENT },

  // Data em ISO 8601 (2026-11-22T19:32:35.805Z) no lugar do epoch em milissegundos.
  timestamp: stdTimeFunctions.isoTime,

  formatters: {
    // Grava "level":"error" em vez de "level":50. Mais legível; o mapeamento para o
    // nível numérico do GELF/syslog fica com o coletor (Fase 4).
    level: (label) => ({ level: label }),
  },

  // Transport roda numa worker thread e transforma a saída antes de escrever.
  // No formato 'pretty' usamos o pino-pretty, que só existe em dev (não está na imagem Docker).
  // No formato 'json' não há transport: o pino escreve direto no stdout, que é o mais rápido.
  transport:
    env.LOG_FORMAT === 'pretty'
      ? {
          target: 'pino-pretty',
          options: {
            // Cores por nível no terminal.
            colorize: true,
            // Uma linha por log, com os campos extras no fim da linha.
            singleLine: true,
            // Hora local legível no lugar do timestamp ISO.
            translateTime: 'SYS:HH:MM:ss.l',
            // Campos que se repetem em toda linha e só poluem o terminal.
            ignore: 'service,env',
          },
        }
      : undefined,
};
