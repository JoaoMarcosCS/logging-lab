import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Response } from 'express';

type LoggedResponse = Response & { err?: Error };

// @Catch() sem argumentos captura qualquer exceção, inclusive as que não são HttpException.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<LoggedResponse>();
    const isHttpException = exception instanceof HttpException;

    // Exceções que não são HttpException são bugs ou falhas de infraestrutura: viram 500.
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // O corpo segue o formato padrão do Nest, para o frontend não perceber diferença.
    // Num 500 o detalhe do erro nunca vai para o cliente, só para o log.
    const body = isHttpException
      ? this.toBody(exception, status)
      : {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        };

    // Este filter não loga nada: ele só anexa a informação à resposta, e o pino-http
    // escreve uma única linha de access log por requisição no fim dela.
    // 5xx: o erro completo vai em res.err, e o pino-http o serializa com stack e cause.
    // 4xx: erro do cliente, sem stack; só a mensagem (do errors.enum.ts) para pesquisar.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      response.err =
        exception instanceof Error ? exception : new Error(String(exception));
    } else if (typeof body.message === 'string') {
      response.locals.errorMessage = body.message;
    }

    this.httpAdapterHost.httpAdapter.reply(response, body, status);
  }

  // HttpException aceita string ou objeto como resposta; normaliza para objeto.
  private toBody(
    exception: HttpException,
    status: number,
  ): Record<string, unknown> {
    const payload = exception.getResponse();
    return typeof payload === 'string'
      ? { statusCode: status, message: payload }
      : (payload as Record<string, unknown>);
  }
}
