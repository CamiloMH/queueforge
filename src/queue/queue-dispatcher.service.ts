import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { JobStatus } from '../persistence/enums/job-status.enum';
import { JobRepository } from '../persistence/repositories/job.repository';
import { SettingsService } from '../settings/settings.service';
import { QueueProducer } from './queue.producer';

/** Número máximo de jobs pendientes procesados por tick. */
const DISPATCH_BATCH_SIZE = 50;
/** Nombre con el que se registra el cron en el {@link SchedulerRegistry}. */
const DISPATCH_CRON_NAME = 'queue-dispatch';

/**
 * Cron interno que mantiene la cola en movimiento.
 *
 * Periódicamente busca jobs que quedaron en estado `PENDING` (creados pero no
 * encolados: tras un reinicio, un fallo al encolar o un seed) y los despacha a BullMQ
 * para que el worker los ejecute. Actúa como red de seguridad para que ningún job se
 * quede atascado fuera de la cola.
 *
 * El cron se registra de forma dinámica y su expresión es **configurable sin redeploy**
 * (base de datos → variable de entorno → valor por defecto), vía {@link SettingsService}.
 */
@Injectable()
export class QueueDispatcherService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(QueueDispatcherService.name);
  /** Evita que dos ticks se solapen en la misma instancia. */
  private isDispatching = false;

  constructor(
    private readonly jobs: JobRepository,
    private readonly producer: QueueProducer,
    private readonly settings: SettingsService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  /** Programa el cron al arrancar con la expresión vigente. */
  async onApplicationBootstrap(): Promise<void> {
    await this.schedule();
  }

  /** Detiene el cron al destruir el módulo. */
  onModuleDestroy(): void {
    this.removeJob();
  }

  /**
   * (Re)programa el cron del despachador con la expresión configurada.
   *
   * Resuelve la expresión vía {@link SettingsService} (BD → entorno → default), por lo
   * que llamar a este método tras cambiar el ajuste aplica el nuevo horario en caliente.
   */
  async schedule(): Promise<void> {
    const cronTime = await this.settings.getDispatchCron();
    this.removeJob();

    const job = CronJob.from({
      cronTime,
      onTick: () => {
        void this.dispatchPending();
      },
      start: false,
    });
    this.scheduler.addCronJob(DISPATCH_CRON_NAME, job);
    job.start();

    this.logger.log(`Despachador programado con cron "${cronTime}".`);
  }

  /**
   * Tick del cron: despacha a la cola los jobs pendientes.
   *
   * Es reentrante-seguro: si un tick anterior sigue en curso, este se omite.
   */
  async dispatchPending(): Promise<void> {
    if (this.isDispatching) {
      return;
    }
    this.isDispatching = true;
    try {
      const pending = await this.jobs.findPending(DISPATCH_BATCH_SIZE);
      let dispatched = 0;
      for (const job of pending) {
        if (await this.dispatch(job.id)) {
          dispatched += 1;
        }
      }
      if (dispatched > 0) {
        this.logger.log(
          `Despachados ${dispatched} job(s) pendientes a la cola.`,
        );
      }
    } finally {
      this.isDispatching = false;
    }
  }

  /** Elimina el cron registrado, si existe. */
  private removeJob(): void {
    if (this.scheduler.doesExist('cron', DISPATCH_CRON_NAME)) {
      this.scheduler.deleteCronJob(DISPATCH_CRON_NAME);
    }
  }

  /**
   * Reclama un job pendiente y lo encola. Si el encolado falla, lo devuelve a
   * `PENDING` para reintentarlo en el siguiente tick.
   *
   * @param jobId - Id del job a despachar.
   * @returns `true` si este proceso lo despachó correctamente.
   */
  private async dispatch(jobId: string): Promise<boolean> {
    const claimed = await this.jobs.claimForDispatch(jobId);
    if (!claimed) {
      return false;
    }

    const job = await this.jobs.findById(jobId);
    if (!job) {
      return false;
    }

    try {
      const bullJobId = await this.producer.enqueue(job);
      await this.jobs.setBullJobId(jobId, bullJobId);
      return true;
    } catch (error) {
      await this.jobs.updateStatus(jobId, JobStatus.PENDING);
      this.logger.error(
        `No se pudo encolar el job ${jobId}; se reintentará.`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
