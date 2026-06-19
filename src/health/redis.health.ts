import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { Queue } from 'bullmq';

import { QUEUE_NAME } from '../queue/queue.constants';

/**
 * Indicador de salud de Redis.
 *
 * Reutiliza el cliente de Redis de BullMQ para hacer `PING`, evitando abrir una
 * conexión adicional solo para el health check.
 */
@Injectable()
export class RedisHealthIndicator {
  constructor(
    @InjectQueue(QUEUE_NAME) private readonly queue: Queue,
    private readonly indicators: HealthIndicatorService,
  ) {}

  /**
   * Comprueba la disponibilidad de Redis.
   *
   * @param key - Clave bajo la que se reporta el resultado.
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.indicators.check(key);
    try {
      // El cliente de BullMQ expone `ping` en runtime aunque su tipo mínimo no lo declare.
      const client = (await this.queue.client) as unknown as {
        ping(): Promise<string>;
      };
      const pong = await client.ping();
      return pong === 'PONG'
        ? indicator.up()
        : indicator.down({ message: 'Respuesta inesperada de Redis' });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Redis no disponible',
      });
    }
  }
}
