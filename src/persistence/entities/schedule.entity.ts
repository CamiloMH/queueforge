import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { JobType } from '../enums/job-type.enum';

/**
 * Definición de un job recurrente (cron).
 *
 * Cada schedule se registra como un "repeatable job" en BullMQ; cuando su patrón
 * cron se cumple, BullMQ encola automáticamente un job del `type` indicado.
 */
@Entity({ name: 'schedules' })
export class Schedule {
  /** Identificador único (UUID). */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Nombre único legible del schedule. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150 })
  name: string;

  /** Tipo de job a encolar en cada disparo (resuelto por su handler). */
  @Column({ type: 'enum', enum: JobType })
  type: JobType;

  /** Expresión cron que define la recurrencia. */
  @Column({ type: 'varchar', length: 100 })
  cronExpression: string;

  /** Payload con el que se encolará cada ejecución. */
  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  /** Indica si el schedule está activo. */
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  /** Zona horaria usada para evaluar la expresión cron. */
  @Column({ type: 'varchar', length: 64, default: 'UTC' })
  timezone: string;

  /** Último disparo registrado (null si nunca se ha ejecutado). */
  @Column({ type: 'datetime', precision: 3, nullable: true })
  lastRunAt: Date | null;

  /** Próximo disparo previsto. */
  @Column({ type: 'datetime', precision: 3, nullable: true })
  nextRunAt: Date | null;

  /** Fecha de creación. */
  @CreateDateColumn()
  createdAt: Date;

  /** Fecha de última actualización. */
  @UpdateDateColumn()
  updatedAt: Date;
}
