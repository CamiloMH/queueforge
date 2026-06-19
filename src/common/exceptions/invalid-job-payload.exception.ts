import { HttpStatus } from '@nestjs/common';

import { DomainException } from './domain.exception';

/**
 * Se lanza cuando el payload de un job no contiene los datos requeridos por su handler.
 * Responde **422 Unprocessable Entity**.
 */
export class InvalidJobPayloadException extends DomainException {
  /**
   * @param type - Tipo de job.
   * @param field - Campo del payload que falta o es inválido.
   */
  constructor(type: string, field: string) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'INVALID_JOB_PAYLOAD',
      `Invalid payload for job "${type}": missing or invalid field "${field}".`,
    );
  }
}
