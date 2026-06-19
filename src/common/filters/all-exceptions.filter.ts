import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { DomainException } from '../exceptions/domain.exception';

/** Umbral a partir del cual una respuesta se considera error de servidor (5xx). */
const SERVER_ERROR_THRESHOLD = 500;

/** Forma estándar de la respuesta de error de la API. */
interface ErrorResponseBody {
  /** Código de estado HTTP. */
  readonly statusCode: number;
  /** Código de error legible por máquina (solo en errores de dominio controlados). */
  readonly errorCode?: string;
  /** Mensaje descriptivo (en inglés para errores controlados). */
  readonly message: string | object;
  /** Ruta de la petición que originó el error. */
  readonly path: string;
  /** Marca temporal ISO-8601. */
  readonly timestamp: string;
}

/**
 * Filtro global que normaliza todas las excepciones a una respuesta JSON uniforme
 * (`statusCode`, `errorCode`, `message`, `path`, `timestamp`) y registra los errores
 * 5xx con su stack.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Convierte la excepción en una respuesta HTTP consistente.
   *
   * @param exception - Excepción capturada.
   * @param host - Contexto de la petición.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= SERVER_ERROR_THRESHOLD) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorCode =
      exception instanceof DomainException ? exception.errorCode : undefined;

    const body: ErrorResponseBody = {
      statusCode: status,
      ...(errorCode ? { errorCode } : {}),
      message: this.resolveMessage(exception),
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  /** Extrae un mensaje legible de la excepción. */
  private resolveMessage(exception: unknown): string | object {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      const message = (response as { message?: string | object }).message;
      return message ?? response;
    }
    return 'Internal server error';
  }
}
