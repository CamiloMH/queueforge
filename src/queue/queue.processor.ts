import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Job as BullJob } from 'bullmq';
import { hostname } from 'os';

import { AppConfigService } from '../config/app-config.service';
import { Job } from '../persistence/entities/job.entity';
import { ExecutionStatus } from '../persistence/enums/execution-status.enum';
import { JobStatus } from '../persistence/enums/job-status.enum';
import { JobExecutionRepository } from '../persistence/repositories/job-execution.repository';
import { JobRepository } from '../persistence/repositories/job.repository';
import { ScheduleRepository } from '../persistence/repositories/schedule.repository';
import { JobHandlerFactory } from './job-handler.factory';
import { JobResult } from './job-handler.interface';
import { QUEUE_NAME } from './queue.constants';
import { QueueJobData } from './queue.types';

/**
 * Worker que consume la cola con concurrencia acotada.
 *
 * Por cada job: registra el intento en el historial, resuelve el handler por tipo
 * mediante {@link JobHandlerFactory} (sin `switch`), ejecuta "la promesa" y actualiza
 * el estado del job. Propaga los errores para que BullMQ gestione los reintentos.
 */
@Processor(QUEUE_NAME)
export class QueueProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(QueueProcessor.name);
  /** Identifica la instancia que ejecuta (relevante con N instancias). */
  private readonly workerId = `${hostname()}:${process.pid}`;

  constructor(
    private readonly factory: JobHandlerFactory,
    private readonly jobs: JobRepository,
    private readonly executions: JobExecutionRepository,
    private readonly schedules: ScheduleRepository,
    private readonly config: AppConfigService,
  ) {
    super();
  }

  /** Ajusta la concurrencia del worker desde la configuración al arrancar. */
  onApplicationBootstrap(): void {
    this.worker.concurrency = this.config.queue.concurrency;
    this.logger.log(
      `Worker listo (concurrencia=${this.config.queue.concurrency}, id=${this.workerId}).`,
    );
  }

  /** Log cuando un job entra en ejecución. */
  @OnWorkerEvent('active')
  onActive(job: BullJob<QueueJobData>): void {
    this.logger.log(
      `▶ Ejecutando job ${job.id} (type=${job.data.type}, intento ${job.attemptsMade + 1}).`,
    );
  }

  /** Log cuando un job termina correctamente. */
  @OnWorkerEvent('completed')
  onCompleted(job: BullJob<QueueJobData>): void {
    this.logger.log(`✓ Job ${job.id} (type=${job.data.type}) completado.`);
  }

  /** Log cuando un job falla (BullMQ aplicará reintentos según `maxAttempts`). */
  @OnWorkerEvent('failed')
  onFailed(job: BullJob<QueueJobData> | undefined, error: Error): void {
    this.logger.warn(
      `✗ Job ${job?.id ?? 'desconocido'} falló: ${error.message}`,
    );
  }

  /**
   * Procesa un job entregado por BullMQ.
   *
   * @param bullJob - Job de la cola.
   * @returns El resultado del handler.
   * @throws Propaga el error del handler para activar los reintentos de BullMQ.
   */
  async process(bullJob: BullJob<QueueJobData>): Promise<JobResult> {
    const job = await this.resolveDomainJob(bullJob.data);
    const attempt = bullJob.attemptsMade + 1;
    const startedAt = new Date();

    const execution = await this.executions.start({
      jobId: job.id,
      attempt,
      workerId: this.workerId,
      startedAt,
    });
    await this.jobs.updateStatus(job.id, JobStatus.ACTIVE, {
      attemptsMade: attempt,
    });

    try {
      const handler = this.factory.get(job.type);
      const result = await handler.execute(job.payload);
      await this.finishExecution(
        execution.id,
        startedAt,
        ExecutionStatus.COMPLETED,
      );
      await this.jobs.updateStatus(job.id, JobStatus.COMPLETED);
      await this.touchSchedule(bullJob.data);
      return result;
    } catch (error) {
      await this.finishExecution(
        execution.id,
        startedAt,
        ExecutionStatus.FAILED,
        this.toMessage(error),
      );
      const nextStatus =
        attempt >= job.maxAttempts ? JobStatus.FAILED : JobStatus.QUEUED;
      await this.jobs.updateStatus(job.id, nextStatus);
      throw error;
    }
  }

  /**
   * Obtiene el job de dominio asociado. Si proviene de un schedule (sin `jobId`),
   * crea el registro correspondiente en MariaDB.
   */
  private async resolveDomainJob(data: QueueJobData): Promise<Job> {
    if (data.jobId) {
      const existing = await this.jobs.findById(data.jobId);
      if (existing) {
        return existing;
      }
    }
    return this.jobs.create({
      type: data.type,
      payload: data.payload,
      maxAttempts: this.config.queue.maxAttempts,
    });
  }

  /** Cierra el registro de ejecución calculando la duración. */
  private async finishExecution(
    executionId: string,
    startedAt: Date,
    status: ExecutionStatus,
    error?: string,
  ): Promise<void> {
    const finishedAt = new Date();
    await this.executions.finish(executionId, {
      status,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      error,
    });
  }

  /** Actualiza `lastRunAt` del schedule de origen, si el job proviene de uno. */
  private async touchSchedule(data: QueueJobData): Promise<void> {
    if (!data.scheduleId) {
      return;
    }
    await this.schedules.update(data.scheduleId, { lastRunAt: new Date() });
  }

  /** Extrae un mensaje legible de un error desconocido. */
  private toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
