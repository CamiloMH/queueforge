import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobExecution } from '../entities/job-execution.entity';
import { ExecutionStatus } from '../enums/execution-status.enum';

/** Datos para registrar el inicio de un intento de ejecución. */
export interface StartExecutionInput {
  readonly jobId: string;
  readonly attempt: number;
  readonly workerId: string;
  readonly startedAt: Date;
}

/** Datos para cerrar un intento de ejecución. */
export interface FinishExecutionInput {
  readonly status: ExecutionStatus;
  readonly finishedAt: Date;
  readonly durationMs: number;
  readonly error?: string;
}

/**
 * Acceso a datos del historial de ejecuciones ({@link JobExecution}).
 */
@Injectable()
export class JobExecutionRepository {
  constructor(
    @InjectRepository(JobExecution)
    private readonly repo: Repository<JobExecution>,
  ) {}

  /**
   * Registra el inicio de un intento de ejecución.
   *
   * @param input - Datos del intento.
   * @returns El registro de ejecución creado (en estado `RUNNING`).
   */
  async start(input: StartExecutionInput): Promise<JobExecution> {
    const execution = this.repo.create({
      jobId: input.jobId,
      attempt: input.attempt,
      workerId: input.workerId,
      startedAt: input.startedAt,
      status: ExecutionStatus.RUNNING,
      finishedAt: null,
      durationMs: null,
      error: null,
    });
    return this.repo.save(execution);
  }

  /**
   * Cierra un intento de ejecución con su resultado final.
   *
   * @param id - Id del registro de ejecución.
   * @param input - Resultado del intento.
   */
  async finish(id: string, input: FinishExecutionInput): Promise<void> {
    await this.repo.update(id, {
      status: input.status,
      finishedAt: input.finishedAt,
      durationMs: input.durationMs,
      error: input.error ?? null,
    });
  }

  /**
   * Devuelve el historial de ejecuciones de un job, del más reciente al más antiguo.
   *
   * @param jobId - Id del job.
   */
  async findByJobId(jobId: string): Promise<JobExecution[]> {
    return this.repo.find({
      where: { jobId },
      order: { attempt: 'DESC' },
    });
  }
}
