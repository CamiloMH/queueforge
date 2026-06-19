import { Inject, Injectable } from '@nestjs/common';

import { DuplicateJobTypeException } from '../common/exceptions/duplicate-job-type.exception';
import { UnknownJobTypeException } from '../common/exceptions/unknown-job-type.exception';
import { JobType } from '../persistence/enums/job-type.enum';
import { JOB_HANDLERS, JobHandler } from './job-handler.interface';

/**
 * Factory que resuelve la estrategia ({@link JobHandler}) para un tipo de job.
 *
 * Construye un registro `tipo -> handler` a partir de todos los handlers inyectados y
 * resuelve por clave. Sustituye a un `switch (type)` y es extensible: añadir un nuevo
 * tipo solo requiere registrar un handler, sin tocar este código (Open/Closed).
 */
@Injectable()
export class JobHandlerFactory {
  private readonly registry: ReadonlyMap<JobType, JobHandler>;

  /**
   * @param handlers - Conjunto de handlers registrados (inyectados vía {@link JOB_HANDLERS}).
   */
  constructor(@Inject(JOB_HANDLERS) handlers: JobHandler[]) {
    this.registry = JobHandlerFactory.buildRegistry(handlers);
  }

  /** Tipos de job soportados, en el orden en que se registraron. */
  get supportedTypes(): JobType[] {
    return [...this.registry.keys()];
  }

  /**
   * Resuelve el handler para un tipo de job.
   *
   * @param type - Tipo de job.
   * @returns El handler registrado para ese tipo.
   * @throws {UnknownJobTypeException} Si no hay handler para el tipo.
   */
  get(type: JobType): JobHandler {
    const handler = this.registry.get(type);
    if (!handler) {
      throw new UnknownJobTypeException(type, this.supportedTypes);
    }
    return handler;
  }

  /**
   * Indica si existe un handler para el tipo dado.
   *
   * @param type - Tipo de job.
   */
  supports(type: JobType): boolean {
    return this.registry.has(type);
  }

  /**
   * Construye el registro inmutable de handlers indexado por tipo.
   *
   * @param handlers - Handlers a registrar.
   * @throws {DuplicateJobTypeException} Si dos handlers comparten el mismo tipo.
   */
  private static buildRegistry(
    handlers: JobHandler[],
  ): ReadonlyMap<JobType, JobHandler> {
    const registry = new Map<JobType, JobHandler>();
    for (const handler of handlers) {
      if (registry.has(handler.type)) {
        throw new DuplicateJobTypeException(handler.type);
      }
      registry.set(handler.type, handler);
    }
    return registry;
  }
}
