import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Schedule } from '../entities/schedule.entity';
import { JobType } from '../enums/job-type.enum';

/** Datos necesarios para crear un schedule. */
export interface CreateScheduleInput {
  readonly name: string;
  readonly type: JobType;
  readonly cronExpression: string;
  readonly payload: Record<string, unknown>;
  readonly enabled: boolean;
  readonly timezone: string;
}

/**
 * Acceso a datos de {@link Schedule} (definiciones de jobs recurrentes).
 */
@Injectable()
export class ScheduleRepository {
  constructor(
    @InjectRepository(Schedule) private readonly repo: Repository<Schedule>,
  ) {}

  /**
   * Crea y persiste un nuevo schedule.
   *
   * @param input - Datos del schedule.
   * @returns El schedule persistido.
   */
  async create(input: CreateScheduleInput): Promise<Schedule> {
    const schedule = this.repo.create(input);
    return this.repo.save(schedule);
  }

  /** Busca un schedule por id; `null` si no existe. */
  async findById(id: string): Promise<Schedule | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Busca un schedule por su nombre único; `null` si no existe. */
  async findByName(name: string): Promise<Schedule | null> {
    return this.repo.findOne({ where: { name } });
  }

  /** Devuelve todos los schedules ordenados por nombre. */
  async findAll(): Promise<Schedule[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  /**
   * Actualiza campos de un schedule.
   *
   * Usa `save` (en lugar de `update`) para soportar correctamente la columna JSON
   * `payload` con el tipado de TypeORM.
   *
   * @param id - Id del schedule.
   * @param patch - Campos a actualizar.
   */
  async update(id: string, patch: Partial<Schedule>): Promise<void> {
    await this.repo.save({ id, ...patch });
  }

  /**
   * Elimina un schedule.
   *
   * @param id - Id del schedule.
   */
  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
