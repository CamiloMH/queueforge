import { Injectable } from '@nestjs/common';

import { InvalidJobPayloadException } from '../../common/exceptions/invalid-job-payload.exception';
import { JobType } from '../../persistence/enums/job-type.enum';
import { JobHandler, JobResult } from '../job-handler.interface';

/** Métodos HTTP que no llevan cuerpo. */
const BODILESS_METHODS = new Set(['GET', 'HEAD']);

/**
 * Handler que realiza una llamada HTTP saliente (webhook).
 *
 * Demuestra un job de E/S real. Payload soportado:
 * `{ url: string, method?: string, headers?: Record<string,string>, body?: unknown }`.
 */
@Injectable()
export class HttpWebhookHandler implements JobHandler {
  readonly type = JobType.HTTP_WEBHOOK;

  /**
   * Ejecuta la petición HTTP.
   *
   * @param payload - Datos de la petición.
   * @returns `{ status }` con el código HTTP de la respuesta.
   * @throws {InvalidJobPayloadException} Si falta una `url` válida.
   * @throws {Error} Si la respuesta no es satisfactoria (status fuera de 2xx).
   */
  async execute(payload: Record<string, unknown>): Promise<JobResult> {
    const url = this.requireUrl(payload);
    const method = this.resolveMethod(payload);

    const response = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...this.resolveHeaders(payload),
      },
      body: BODILESS_METHODS.has(method)
        ? undefined
        : JSON.stringify(payload.body ?? {}),
    });

    if (!response.ok) {
      throw new Error(
        `El webhook ${url} respondió con status ${response.status}.`,
      );
    }
    return { status: response.status };
  }

  /**
   * Obtiene y valida la URL de destino.
   *
   * @throws {InvalidJobPayloadException} Si la `url` falta o no es un string.
   */
  private requireUrl(payload: Record<string, unknown>): string {
    const url = payload.url;
    if (typeof url !== 'string' || url.length === 0) {
      throw new InvalidJobPayloadException(this.type, 'url');
    }
    return url;
  }

  /** Resuelve el método HTTP en mayúsculas (POST por defecto). */
  private resolveMethod(payload: Record<string, unknown>): string {
    const method = typeof payload.method === 'string' ? payload.method : 'POST';
    return method.toUpperCase();
  }

  /** Resuelve las cabeceras adicionales del payload. */
  private resolveHeaders(
    payload: Record<string, unknown>,
  ): Record<string, string> {
    const headers = payload.headers;
    if (headers && typeof headers === 'object') {
      return headers as Record<string, string>;
    }
    return {};
  }
}
