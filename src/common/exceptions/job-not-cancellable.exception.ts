import { HttpStatus } from '@nestjs/common';

import { DomainException } from './domain.exception';

/**
 * Se lanza al intentar cancelar un job que ya está en un estado final.
 * Responde **409 Conflict**.
 */
export class JobNotCancellableException extends DomainException {
  /**
   * @param id - Id del job.
   * @param status - Estado actual (final) del job.
   */
  constructor(id: string, status: string) {
    super(
      HttpStatus.CONFLICT,
      'JOB_NOT_CANCELLABLE',
      `Job ${id} is in state "${status}" and cannot be cancelled.`,
    );
  }
}
