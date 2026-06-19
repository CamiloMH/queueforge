/**
 * Estados posibles de un job a lo largo de su ciclo de vida.
 *
 * Refleja el estado de negocio persistido en MariaDB, complementario al estado
 * interno que BullMQ mantiene en Redis.
 */
export enum JobStatus {
  /** Creado en la base de datos, aún no encolado en BullMQ. */
  PENDING = 'pending',
  /** Encolado en BullMQ, a la espera de un worker. */
  QUEUED = 'queued',
  /** Un worker lo está ejecutando. */
  ACTIVE = 'active',
  /** Terminó correctamente. */
  COMPLETED = 'completed',
  /** Agotó los reintentos y falló de forma definitiva. */
  FAILED = 'failed',
  /** Cancelado por el usuario antes de completarse. */
  CANCELLED = 'cancelled',
}
