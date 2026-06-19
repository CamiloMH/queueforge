import { Injectable } from '@nestjs/common';

import { JobType } from '../../persistence/enums/job-type.enum';
import { JobHandler, JobResult } from '../job-handler.interface';

/** Espera máxima permitida (ms) para la tarea de demostración. */
const MAX_DELAY_MS = 60_000;
/** Espera por defecto (ms) cuando el payload no especifica `delayMs`. */
const DEFAULT_DELAY_MS = 100;

/**
 * Handler de demostración: simula trabajo asíncrono esperando un tiempo dado.
 *
 * Útil para probar la concurrencia y el historial sin depender de servicios externos.
 * Payload soportado: `{ delayMs?: number }`.
 */
@Injectable()
export class DelayDemoHandler implements JobHandler {
  readonly type = JobType.DELAY_DEMO;

  /**
   * @param payload - `{ delayMs?: number }`.
   * @returns Objeto con los milisegundos efectivamente esperados.
   */
  async execute(payload: Record<string, unknown>): Promise<JobResult> {
    const delayMs = this.resolveDelay(payload);
    await this.sleep(delayMs);
    return { sleptMs: delayMs };
  }

  /**
   * Normaliza el tiempo de espera al rango `[0, MAX_DELAY_MS]`.
   *
   * @param payload - Payload del job.
   */
  private resolveDelay(payload: Record<string, unknown>): number {
    const raw = Number(payload.delayMs ?? DEFAULT_DELAY_MS);
    if (!Number.isFinite(raw) || raw < 0) {
      return 0;
    }
    return Math.min(raw, MAX_DELAY_MS);
  }

  /**
   * Promesa que se resuelve tras `ms` milisegundos.
   *
   * @param ms - Milisegundos a esperar.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
