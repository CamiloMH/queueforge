import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { JobStatus } from '../enums/job-status.enum';
import { JobType } from '../enums/job-type.enum';
import { JobExecution } from './job-execution.entity';

/**
 * Job persistido: la definición y el estado de negocio de una unidad de trabajo
 * que será ejecutada por un worker. Es la fuente de verdad en MariaDB; BullMQ/Redis
 * solo gestiona el ciclo de cola en tiempo de ejecución.
 */
@Entity({ name: 'jobs' })
export class Job {
  /** Identificador único (UUID). */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tipo de job; determina qué handler (estrategia) lo procesa. */
  @Index()
  @Column({ type: 'enum', enum: JobType })
  type: JobType;

  /** Datos de entrada del job, pasados al handler. */
  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  /** Estado actual en el ciclo de vida del job. */
  @Index()
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  /** Prioridad en la cola (menor = mayor prioridad en BullMQ). */
  @Column({ type: 'int', default: 0 })
  priority: number;

  /** Número de intentos realizados hasta ahora. */
  @Column({ type: 'int', default: 0 })
  attemptsMade: number;

  /** Número máximo de intentos antes de marcarlo como fallido. */
  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  /** Identificador del job en BullMQ (null hasta que se encola). */
  @Column({ type: 'varchar', length: 100, nullable: true })
  bullJobId: string | null;

  /** Historial de intentos de ejecución de este job. */
  @OneToMany(() => JobExecution, (execution) => execution.job)
  executions: JobExecution[];

  /** Fecha de creación. */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización. */
  @UpdateDateColumn()
  updatedAt: Date;
}
