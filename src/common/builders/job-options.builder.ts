import { JobsOptions } from 'bullmq';

/**
 * Builder fluido para construir las opciones de un job de BullMQ (patrón Builder).
 *
 * Evita constructores telescópicos y la repetición de objetos de opciones a lo largo
 * del código, ofreciendo una API encadenable y legible.
 *
 * @example
 * const opts = new JobOptionsBuilder()
 *   .withAttempts(3)
 *   .withExponentialBackoff(1000)
 *   .build();
 */
export class JobOptionsBuilder {
  private readonly options: JobsOptions = {};

  /**
   * Define la prioridad (menor número = mayor prioridad). Se ignora si es `undefined`.
   *
   * @param priority - Prioridad del job.
   */
  withPriority(priority?: number): this {
    if (priority !== undefined) {
      this.options.priority = priority;
    }
    return this;
  }

  /**
   * Define el número máximo de intentos.
   *
   * @param attempts - Reintentos máximos.
   */
  withAttempts(attempts: number): this {
    this.options.attempts = attempts;
    return this;
  }

  /**
   * Configura backoff exponencial entre reintentos.
   *
   * @param delayMs - Retardo base en milisegundos.
   */
  withExponentialBackoff(delayMs: number): this {
    this.options.backoff = { type: 'exponential', delay: delayMs };
    return this;
  }

  /**
   * Limita cuántos jobs completados se conservan en Redis.
   *
   * @param count - Número de jobs completados a retener.
   */
  withRemoveOnComplete(count: number): this {
    this.options.removeOnComplete = count;
    return this;
  }

  /**
   * Devuelve una copia inmutable de las opciones construidas.
   */
  build(): JobsOptions {
    return { ...this.options };
  }
}
