import { JobType } from '../persistence/enums/job-type.enum';

/**
 * Resultado opcional de la ejecución de un job. Se persiste junto al historial.
 */
export type JobResult = Record<string, unknown> | void;

/**
 * Estrategia de ejecución para un tipo de job (patrón Strategy).
 *
 * Cada tipo de trabajo implementa esta interfaz; el motor resuelve la estrategia
 * adecuada en tiempo de ejecución mediante {@link JobHandlerFactory}, evitando
 * condicionales por tipo (`switch`/`if`).
 */
export interface JobHandler {
  /** Tipo de job que maneja esta estrategia (clave única en el registro). */
  readonly type: JobType;

  /**
   * Ejecuta el trabajo asociado al job. Es "la promesa" que el worker resuelve.
   *
   * @param payload - Datos de entrada del job.
   * @returns Un resultado opcional que se registra junto al historial de ejecución.
   * @throws Si el trabajo falla; el error se registra y BullMQ aplica los reintentos.
   */
  execute(payload: Record<string, unknown>): Promise<JobResult>;
}

/**
 * Token de inyección para el conjunto de handlers registrados.
 *
 * Permite registrar N estrategias con un único provider de tipo array y que la
 * factory las descubra sin acoplarse a cada implementación concreta.
 */
export const JOB_HANDLERS = Symbol('JOB_HANDLERS');
