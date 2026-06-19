import { JobType } from '../persistence/enums/job-type.enum';

/**
 * Datos que viajan con cada job de BullMQ.
 *
 * - `jobId` está presente cuando el job lo creó la API (ya existe en MariaDB).
 * - `scheduleId` está presente cuando el job proviene de un schedule (cron).
 */
export interface QueueJobData {
  /** Id del {@link Job} de dominio, si fue creado por la API. */
  readonly jobId?: string;
  /** Id del {@link Schedule} que originó el job, si proviene de un cron. */
  readonly scheduleId?: string;
  /** Tipo de job (determina el handler que lo procesa). */
  readonly type: JobType;
  /** Payload de entrada del job. */
  readonly payload: Record<string, unknown>;
}
