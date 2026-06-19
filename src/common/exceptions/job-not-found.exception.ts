import { HttpStatus } from '@nestjs/common';

import { DomainException } from './domain.exception';

/**
 * Se lanza cuando se referencia un job que no existe. Responde **404 Not Found**.
 */
export class JobNotFoundException extends DomainException {
  /**
   * @param id - Id del job no encontrado.
   */
  constructor(id: string) {
    super(HttpStatus.NOT_FOUND, 'JOB_NOT_FOUND', `Job ${id} was not found.`);
  }
}
