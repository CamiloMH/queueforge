/**
 * Nombre de la cola principal en BullMQ.
 *
 * Es una constante (no configurable por entorno) porque los decoradores
 * `@Processor` y `@InjectQueue` requieren un literal en tiempo de compilación.
 */
export const QUEUE_NAME = 'queueforge';
