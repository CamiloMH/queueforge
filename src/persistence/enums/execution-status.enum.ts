/**
 * Estado de un intento individual de ejecución de un job (registro de historial).
 */
export enum ExecutionStatus {
  /** El intento está en curso. */
  RUNNING = 'running',
  /** El intento terminó correctamente. */
  COMPLETED = 'completed',
  /** El intento falló (puede haber reintentos posteriores). */
  FAILED = 'failed',
}
