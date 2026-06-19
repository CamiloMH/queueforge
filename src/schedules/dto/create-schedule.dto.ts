import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { JobType } from '../../persistence/enums/job-type.enum';

/**
 * Datos de entrada para crear un schedule (job recurrente).
 */
export class CreateScheduleDto {
  @ApiProperty({
    example: 'limpieza-nocturna',
    description: 'Nombre único del schedule.',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    enum: JobType,
    example: JobType.DELAY_DEMO,
    description: 'Tipo de job a encolar en cada disparo.',
  })
  @IsEnum(JobType)
  type: JobType;

  @ApiProperty({
    example: '*/5 * * * *',
    description: 'Expresión cron (5 o 6 campos).',
  })
  @IsString()
  @MinLength(1)
  cronExpression: string;

  @ApiPropertyOptional({
    description: 'Payload con el que se encolará cada ejecución.',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Si el schedule arranca activo.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Zona horaria para evaluar el cron.',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
