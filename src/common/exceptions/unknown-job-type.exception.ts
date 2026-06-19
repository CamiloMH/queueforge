import { HttpStatus } from '@nestjs/common';

import { DomainException } from './domain.exception';

/**
 * Se lanza cuando se solicita ejecutar/encolar un job cuyo `type` no tiene un handler
 * (estrategia) registrado. Responde **422 Unprocessable Entity**.
 */
export class UnknownJobTypeException extends DomainException {
  /**
   * @param type - Tipo de job solicitado.
   * @param supportedTypes - Tipos de job actualmente soportados.
   */
  constructor(type: string, supportedTypes: string[]) {
    const supported =
      supportedTypes.length > 0 ? supportedTypes.join(', ') : 'none';
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'UNKNOWN_JOB_TYPE',
      `No handler is registered for job type "${type}". Supported types: ${supported}.`,
    );
  }
}
