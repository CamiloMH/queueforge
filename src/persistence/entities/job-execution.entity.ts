import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ExecutionStatus } from '../enums/execution-status.enum';
import { Job } from './job.entity';

/**
 * Registro de historial: un intento individual de ejecución de un job.
 *
 * Cada vez que un worker procesa un job se crea una fila aquí, lo que permite
 * auditar reintentos, duración, errores y qué instancia (worker) lo ejecutó.
 */
@Entity({ name: 'job_executions' })
export class JobExecution {
  /** Identificador único (UUID). */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Job al que pertenece este intento. */
  @Index()
  @Column({ type: 'uuid' })
  jobId: string;

  /** Relación con el job padre (cascada de borrado). */
  @ManyToOne(() => Job, (job) => job.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  /** Número de intento (1-based). */
  @Column({ type: 'int' })
  attempt: number;

  /** Estado de este intento. */
  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.RUNNING,
  })
  status: ExecutionStatus;

  /** Instante de inicio del intento. */
  @Column({ type: 'datetime', precision: 3 })
  startedAt: Date;

  /** Instante de fin del intento (null mientras está en curso). */
  @Column({ type: 'datetime', precision: 3, nullable: true })
  finishedAt: Date | null;

  /** Duración del intento en milisegundos (null mientras está en curso). */
  @Column({ type: 'int', nullable: true })
  durationMs: number | null;

  /** Mensaje de error si el intento falló. */
  @Column({ type: 'text', nullable: true })
  error: string | null;

  /** Identificador de la instancia/worker que ejecutó el intento. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  workerId: string | null;
}
