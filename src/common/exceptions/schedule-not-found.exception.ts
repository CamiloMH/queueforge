import { HttpStatus } from '@nestjs/common';

import { DomainException } from './domain.exception';

/**
 * Se lanza cuando se referencia un schedule que no existe. Responde **404 Not Found**.
 */
export class ScheduleNotFoundException extends DomainException {
  /**
   * @param id - Id del schedule no encontrado.
   */
  constructor(id: string) {
    super(
      HttpStatus.NOT_FOUND,
      'SCHEDULE_NOT_FOUND',
      `Schedule ${id} was not found.`,
    );
  }
}
