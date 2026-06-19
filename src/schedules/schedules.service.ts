import { Injectable } from '@nestjs/common';

import { InvalidCronExpressionException } from '../common/exceptions/invalid-cron-expression.exception';
import { ScheduleNameTakenException } from '../common/exceptions/schedule-name-taken.exception';
import { ScheduleNotFoundException } from '../common/exceptions/schedule-not-found.exception';
import { UnknownJobTypeException } from '../common/exceptions/unknown-job-type.exception';
import { Schedule } from '../persistence/entities/schedule.entity';
import { JobType } from '../persistence/enums/job-type.enum';
import { ScheduleRepository } from '../persistence/repositories/schedule.repository';
import { JobHandlerFactory } from '../queue/job-handler.factory';
import { QueueProducer } from '../queue/queue.producer';
import { isValidCronExpression } from './cron.util';
import { CreateScheduleDto } from './dto/create-schedule.dto';

/** Zona horaria por defecto de un schedule. */
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Casos de uso de schedules (jobs recurrentes).
 *
 * Mantiene sincronizados el registro en MariaDB y el "repeatable job" en BullMQ.
 */
@Injectable()
export class SchedulesService {
  constructor(
    private readonly schedules: ScheduleRepository,
    private readonly producer: QueueProducer,
    private readonly factory: JobHandlerFactory,
  ) {}

  /**
   * Crea un schedule y, si está activo, lo registra en BullMQ.
   *
   * @param dto - Datos del schedule.
   * @throws {UnknownJobTypeException} Si el tipo no tiene handler.
   * @throws {BadRequestException} Si la expresión cron es inválida.
   * @throws {ConflictException} Si el nombre ya existe.
   */
  async create(dto: CreateScheduleDto): Promise<Schedule> {
    this.assertSupportedType(dto.type);
    this.assertValidCron(dto.cronExpression);
    await this.assertNameAvailable(dto.name);

    const schedule = await this.schedules.create({
      name: dto.name,
      type: dto.type,
      cronExpression: dto.cronExpression,
      payload: dto.payload ?? {},
      enabled: dto.enabled ?? true,
      timezone: dto.timezone ?? DEFAULT_TIMEZONE,
    });
    await this.sync(schedule);
    return schedule;
  }

  /** Lista todos los schedules. */
  findAll(): Promise<Schedule[]> {
    return this.schedules.findAll();
  }

  /**
   * Obtiene un schedule por id.
   *
   * @throws {ScheduleNotFoundException} Si no existe.
   */
  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.schedules.findById(id);
    if (!schedule) {
      throw new ScheduleNotFoundException(id);
    }
    return schedule;
  }

  /**
   * Activa o desactiva un schedule y sincroniza BullMQ.
   *
   * @param id - Id del schedule.
   * @param enabled - Nuevo estado.
   */
  async setEnabled(id: string, enabled: boolean): Promise<Schedule> {
    const schedule = await this.findOne(id);
    await this.schedules.update(id, { enabled });
    schedule.enabled = enabled;
    await this.sync(schedule);
    return schedule;
  }

  /**
   * Elimina un schedule y su job recurrente en BullMQ.
   *
   * @param id - Id del schedule.
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.producer.removeSchedule(id);
    await this.schedules.delete(id);
  }

  /** Sincroniza el repeatable job de BullMQ con el estado del schedule. */
  private async sync(schedule: Schedule): Promise<void> {
    if (schedule.enabled) {
      await this.producer.upsertSchedule(schedule);
      return;
    }
    await this.producer.removeSchedule(schedule.id);
  }

  /** @throws {UnknownJobTypeException} Si el tipo no tiene handler registrado. */
  private assertSupportedType(type: JobType): void {
    if (!this.factory.supports(type)) {
      throw new UnknownJobTypeException(type, this.factory.supportedTypes);
    }
  }

  /** @throws {InvalidCronExpressionException} Si la expresión cron es inválida. */
  private assertValidCron(expression: string): void {
    if (!isValidCronExpression(expression)) {
      throw new InvalidCronExpressionException(expression);
    }
  }

  /** @throws {ScheduleNameTakenException} Si ya existe un schedule con ese nombre. */
  private async assertNameAvailable(name: string): Promise<void> {
    const existing = await this.schedules.findByName(name);
    if (existing) {
      throw new ScheduleNameTakenException(name);
    }
  }
}
