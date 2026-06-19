import { HttpStatus } from '@nestjs/common';

import { DomainException } from './domain.exception';

/**
 * Se lanza cuando un schedule define una expresión cron inválida.
 * Responde **400 Bad Request**.
 */
export class InvalidCronExpressionException extends DomainException {
  /**
   * @param expression - Expresión cron inválida.
   */
  constructor(expression: string) {
    super(
      HttpStatus.BAD_REQUEST,
      'INVALID_CRON_EXPRESSION',
      `Invalid cron expression: "${expression}".`,
    );
  }
}
