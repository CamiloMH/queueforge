import { HttpStatus } from '@nestjs/common';

import { DomainException } from './domain.exception';

/**
 * Se lanza al crear un schedule con un nombre que ya existe.
 * Responde **409 Conflict**.
 */
export class ScheduleNameTakenException extends DomainException {
  /**
   * @param name - Nombre del schedule duplicado.
   */
  constructor(name: string) {
    super(
      HttpStatus.CONFLICT,
      'SCHEDULE_NAME_TAKEN',
      `A schedule with name "${name}" already exists.`,
    );
  }
}
