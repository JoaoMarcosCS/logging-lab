import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { loggerConfig } from './logger.config.js';

const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;
const HEALTH_CHECK_PATH = '/api/health';

type HttpRequest = IncomingMessage & {
  originalUrl?: string;
  route?: { path?: string };
};

type HttpResponse = ServerResponse & {
  locals?: { errorMessage?: string };
};

// Monta os campos do access log no fim da requisição. Campos planos (method, route...)
// são mais fáceis de pesquisar e agrupar no Graylog do que objetos aninhados (req.method).
const requestFields = (
  req: HttpRequest,
  res: HttpResponse,
  durationMs: number,
) => ({
  method: req.method,
  // URL real sem query string, que pode carregar dados que não queremos no log.
  path: (req.originalUrl ?? req.url ?? '').split('?')[0],
  // Template da rota (/api/v1/boards/:id). É o campo para agrupar métricas por endpoint.
  // Só existe no fim da requisição, depois que o Express escolheu a rota.
  route: req.route?.path,
  statusCode: res.statusCode,
  durationMs,
  // Mensagem do erro 4xx, preenchida pelo HttpExceptionFilter.
  errorMessage: res.locals?.errorMessage,
});

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      // Faz o PinoLogger.assign() (usado no AuthGuard) chegar também ao access log,
      // e não só aos logs emitidos durante a requisição.
      assignResponse: true,

      pinoHttp: {
        // Opções base do pino (nível, campos fixos, timestamp, transport).
        ...loggerConfig,

        // Rede de segurança: se algum dia um desses campos for logado, sai mascarado.
        // Os caminhos são exatos; '*.password' cobre só um nível de profundidade.
        redact: {
          paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'res.headers["set-cookie"]',
            'password',
            '*.password',
            'currentPassword',
            '*.currentPassword',
            'newPassword',
            '*.newPassword',
            'accessToken',
            'refreshToken',
            '*.accessToken',
            '*.refreshToken',
          ],
          // Texto que substitui o valor mascarado.
          censor: '*****',
        },

        // Define o id de cada requisição. Reaproveita o X-Request-Id de quem chamou
        // (outro serviço, gateway, frontend) para correlacionar ponta a ponta. O formato
        // é validado para ninguém injetar texto arbitrário nos logs. O id volta no
        // header da resposta, para quem reportar um problema poder informá-lo.
        genReqId: (req: HttpRequest, res: HttpResponse) => {
          const incoming = req.headers[REQUEST_ID_HEADER];
          const id =
            typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming)
              ? incoming
              : randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },

        // Liga o access log (uma linha por requisição), exceto no health check,
        // que é chamado a cada poucos segundos e só geraria ruído.
        autoLogging: {
          ignore: (req: HttpRequest) => req.url === HEALTH_CHECK_PATH,
        },

        // Renomeia o campo do id da requisição de "reqId" para "requestId".
        customAttributeKeys: { reqId: 'requestId' },

        // Logs emitidos durante a requisição levam só o requestId, não o objeto req inteiro.
        quietReqLogger: true,

        // O access log também não leva req/res inteiros; os campos vêm de customSuccessObject.
        quietResLogger: true,

        // Nível do access log pelo status: 5xx é problema nosso (error),
        // 4xx é erro do cliente (warn) e o resto é info.
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },

        // Mensagens constantes: o que varia fica nos campos, então dá para contar e agrupar.
        customSuccessMessage: () => 'request completed',
        customErrorMessage: () => 'request failed',

        // Corpo do access log de requisições sem erro (inclui 4xx).
        customSuccessObject: (req, res, val: { responseTime: number }) =>
          requestFields(req, res, val.responseTime),

        // Corpo do access log quando há erro (5xx). O err vem do res.err
        // preenchido pelo HttpExceptionFilter e sai com type, message, stack e cause.
        customErrorObject: (req, res, err, val: { responseTime: number }) => ({
          ...requestFields(req, res, val.responseTime),
          err,
        }),
      },
    }),
  ],
})
export class LoggerModule {}
