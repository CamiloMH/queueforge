import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Job } from '../entities/job.entity';
import { JobStatus } from '../enums/job-status.enum';
import { JobType } from '../enums/job-type.enum';

/** Datos necesarios para crear un nuevo job. */
export interface CreateJobInput {
  readonly type: JobType;
  readonly payload: Record<string, unknown>;
  readonly priority?: number;
  readonly maxAttempts: number;
}

/** Filtros opcionales y paginación para listar jobs. */
export interface FindJobsOptions {
  readonly status?: JobStatus;
  readonly type?: JobType;
  readonly skip: number;
  readonly take: number;
}

/** Resultado paginado de una búsqueda de jobs. */
export interface PaginatedJobs {
  readonly items: Job[];
  readonly total: number;
}

/**
 * Acceso a datos de {@link Job}. Encapsula TypeORM tras una interfaz de dominio
 * (repository pattern) para mantener los servicios testables y desacoplados del ORM.
 */
@Injectable()
export class JobRepository {
  constructor(@InjectRepository(Job) private readonly repo: Repository<Job>) {}

  /**
   * Crea y persiste un nuevo job en estado {@link JobStatus.PENDING}.
   *
   * @param input - Datos del job a crear.
   * @returns El job persistido con su id generado.
   */
  async create(input: CreateJobInput): Promise<Job> {
    const job = this.repo.create({
      type: input.type,
      payload: input.payload,
      priority: input.priority ?? 0,
      maxAttempts: input.maxAttempts,
      status: JobStatus.PENDING,
      attemptsMade: 0,
      bullJobId: null,
    });
    return this.repo.save(job);
  }

  /**
   * Marca un job como encolado y guarda su identificador en BullMQ.
   *
   * @param id - Id del job.
   * @param bullJobId - Identificador asignado por BullMQ.
   */
  async markQueued(id: string, bullJobId: string): Promise<void> {
    await this.repo.update(id, { status: JobStatus.QUEUED, bullJobId });
  }

  /**
   * Actualiza el estado de un job y, opcionalmente, otros campos.
   *
   * @param id - Id del job.
   * @param status - Nuevo estado.
   * @param patch - Campos adicionales a actualizar (p. ej. `attemptsMade`).
   */
  async updateStatus(
    id: string,
    status: JobStatus,
    patch: Partial<Pick<Job, 'attemptsMade'>> = {},
  ): Promise<void> {
    await this.repo.update(id, { status, ...patch });
  }

  /**
   * Asigna el identificador de BullMQ a un job ya encolado.
   *
   * @param id - Id del job.
   * @param bullJobId - Identificador asignado por BullMQ.
   */
  async setBullJobId(id: string, bullJobId: string): Promise<void> {
    await this.repo.update(id, { bullJobId });
  }

  /**
   * Busca un job por su id.
   *
   * @returns El job, o `null` si no existe.
   */
  async findById(id: string): Promise<Job | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Devuelve los jobs en estado {@link JobStatus.PENDING} más antiguos (FIFO).
   *
   * Lo usa el despachador para reencolar jobs que quedaron pendientes (tras un
   * reinicio, un fallo al encolar o un seed).
   *
   * @param limit - Número máximo de jobs a devolver.
   */
  async findPending(limit: number): Promise<Job[]> {
    return this.repo.find({
      where: { status: JobStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Reclama de forma atómica un job `PENDING` para despacharlo, pasándolo a `QUEUED`.
   *
   * La condición `status = PENDING` en el `UPDATE` evita que dos instancias despachen
   * el mismo job (solo una verá `affected = 1`).
   *
   * @param id - Id del job.
   * @returns `true` si esta llamada reclamó el job.
   */
  async claimForDispatch(id: string): Promise<boolean> {
    const result = await this.repo.update(
      { id, status: JobStatus.PENDING },
      { status: JobStatus.QUEUED },
    );
    return result.affected === 1;
  }

  /**
   * Lista jobs aplicando filtros opcionales y paginación.
   *
   * @param options - Filtros y paginación.
   * @returns Página de jobs y total de coincidencias.
   */
  async findMany(options: FindJobsOptions): Promise<PaginatedJobs> {
    const where: FindOptionsWhere<Job> = {};
    if (options.status) where.status = options.status;
    if (options.type) where.type = options.type;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: options.skip,
      take: options.take,
    });
    return { items, total };
  }
}
