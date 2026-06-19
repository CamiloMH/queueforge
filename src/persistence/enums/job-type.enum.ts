/**
 * Catálogo de tipos de job soportados.
 *
 * Cada valor se corresponde 1:1 con un handler (estrategia) registrado. Añadir un
 * nuevo tipo implica añadir un valor aquí y su handler correspondiente.
 */
export enum JobType {
  /** Tarea de demostración que simula trabajo asíncrono esperando un tiempo. */
  DELAY_DEMO = 'delay-demo',
  /** Realiza una llamada HTTP saliente (webhook). */
  HTTP_WEBHOOK = 'http-webhook',
}
