import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { JobOptionsBuilder } from '../common/builders/job-options.builder';
import { AppConfigService } from '../config/app-config.service';
import { Job } from '../persistence/entities/job.entity';
import { Schedule } from '../persistence/entities/schedule.entity';
import { QUEUE_NAME } from './queue.constants';
import { QueueJobData } from './queue.types';

/** Número de jobs completados que se conservan en Redis. */
const KEEP_COMPLETED = 1000;

/**
 * Productor de la cola: encola jobs puntuales y registra jobs recurrentes (cron)
 * en BullMQ. Encapsula la interacción con la cola de Redis.
 */
@Injectable()
export class QueueProducer {
  constructor(
    @InjectQueue(QUEUE_NAME) private readonly queue: Queue<QueueJobData>,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Encola un job para ejecución asíncrona.
   *
   * @param job - Job de dominio ya persistido.
   * @returns El identificador asignado por BullMQ.
   */
  async enqueue(job: Job): Promise<string> {
    const options = new JobOptionsBuilder()
      .withPriority(job.priority)
      .withAttempts(job.maxAttempts)
      .withExponentialBackoff(this.config.queue.backoffMs)
      .withRemoveOnComplete(KEEP_COMPLETED)
      .build();

    const bullJob = await this.queue.add(
      job.type,
      { jobId: job.id, type: job.type, payload: job.payload },
      options,
    );
    return String(bullJob.id);
  }

  /**
   * Elimina un job pendiente de la cola (cancelación).
   *
   * @param bullJobId - Identificador del job en BullMQ.
   */
  async cancel(bullJobId: string): Promise<void> {
    const bullJob = await this.queue.getJob(bullJobId);
    if (bullJob) {
      await bullJob.remove();
    }
  }

  /**
   * Crea o actualiza el job recurrente (cron) asociado a un schedule.
   *
   * @param schedule - Definición del schedule.
   */
  async upsertSchedule(schedule: Schedule): Promise<void> {
    const options = new JobOptionsBuilder()
      .withAttempts(this.config.queue.maxAttempts)
      .withExponentialBackoff(this.config.queue.backoffMs)
      .build();

    await this.queue.upsertJobScheduler(
      schedule.id,
      { pattern: schedule.cronExpression, tz: schedule.timezone },
      {
        name: schedule.type,
        data: {
          scheduleId: schedule.id,
          type: schedule.type,
          payload: schedule.payload,
        },
        opts: options,
      },
    );
  }

  /**
   * Elimina el job recurrente asociado a un schedule.
   *
   * @param scheduleId - Id del schedule.
   */
  async removeSchedule(scheduleId: string): Promise<void> {
    await this.queue.removeJobScheduler(scheduleId);
  }
}
