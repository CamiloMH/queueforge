import { Injectable } from '@nestjs/common';

import { JobNotCancellableException } from '../common/exceptions/job-not-cancellable.exception';
import { JobNotFoundException } from '../common/exceptions/job-not-found.exception';
import { UnknownJobTypeException } from '../common/exceptions/unknown-job-type.exception';
import { AppConfigService } from '../config/app-config.service';
import { JobExecution } from '../persistence/entities/job-execution.entity';
import { Job } from '../persistence/entities/job.entity';
import { JobStatus } from '../persistence/enums/job-status.enum';
import { JobExecutionRepository } from '../persistence/repositories/job-execution.repository';
import {
  JobRepository,
  PaginatedJobs,
} from '../persistence/repositories/job.repository';
import { JobHandlerFactory } from '../queue/job-handler.factory';
import { QueueProducer } from '../queue/queue.producer';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';

/** Página por defecto al listar. */
const DEFAULT_PAGE = 1;
/** Tamaño de página por defecto al listar. */
const DEFAULT_LIMIT = 20;

/** Estados finales: un job en estos estados ya no puede cancelarse. */
const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
  JobStatus.COMPLETED,
  JobStatus.FAILED,
  JobStatus.CANCELLED,
]);

/**
 * Casos de uso de jobs: encolar, consultar, listar, ver historial y cancelar.
 *
 * Orquesta la persistencia (MariaDB) y el motor de cola (BullMQ) manteniendo el
 * estado consistente entre ambos.
 */
@Injectable()
export class JobsService {
  constructor(
    private readonly jobs: JobRepository,
    private readonly executions: JobExecutionRepository,
    private readonly producer: QueueProducer,
    private readonly factory: JobHandlerFactory,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Crea un job, lo persiste y lo encola en BullMQ.
   *
   * @param dto - Datos del job.
   * @returns El job persistido y encolado.
   * @throws {UnknownJobTypeException} Si el tipo no tiene handler registrado.
   */
  async create(dto: CreateJobDto): Promise<Job> {
    if (!this.factory.supports(dto.type)) {
      throw new UnknownJobTypeException(dto.type, this.factory.supportedTypes);
    }

    const job = await this.jobs.create({
      type: dto.type,
      payload: dto.payload ?? {},
      priority: dto.priority,
      maxAttempts: dto.maxAttempts ?? this.config.queue.maxAttempts,
    });

    const bullJobId = await this.producer.enqueue(job);
    await this.jobs.markQueued(job.id, bullJobId);

    job.status = JobStatus.QUEUED;
    job.bullJobId = bullJobId;
    return job;
  }

  /**
   * Lista jobs aplicando filtros y paginación.
   *
   * @param query - Filtros y paginación.
   */
  async findMany(query: QueryJobsDto): Promise<PaginatedJobs> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    return this.jobs.findMany({
      status: query.status,
      type: query.type,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  /**
   * Obtiene un job por id.
   *
   * @param id - Id del job.
   * @throws {JobNotFoundException} Si el job no existe.
   */
  async findOne(id: string): Promise<Job> {
    const job = await this.jobs.findById(id);
    if (!job) {
      throw new JobNotFoundException(id);
    }
    return job;
  }

  /**
   * Devuelve el historial de ejecuciones de un job.
   *
   * @param id - Id del job.
   * @throws {JobNotFoundException} Si el job no existe.
   */
  async getHistory(id: string): Promise<JobExecution[]> {
    await this.findOne(id);
    return this.executions.findByJobId(id);
  }

  /**
   * Cancela un job pendiente o en cola.
   *
   * @param id - Id del job.
   * @returns El job actualizado.
   * @throws {JobNotFoundException} Si el job no existe.
   * @throws {JobNotCancellableException} Si el job ya está en un estado final.
   */
  async cancel(id: string): Promise<Job> {
    const job = await this.findOne(id);
    if (TERMINAL_STATUSES.has(job.status)) {
      throw new JobNotCancellableException(id, job.status);
    }

    if (job.bullJobId) {
      await this.producer.cancel(job.bullJobId);
    }
    await this.jobs.updateStatus(id, JobStatus.CANCELLED);

    job.status = JobStatus.CANCELLED;
    return job;
  }
}
