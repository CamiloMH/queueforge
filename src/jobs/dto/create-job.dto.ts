import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

import { JobType } from '../../persistence/enums/job-type.enum';

/**
 * Datos de entrada para encolar un nuevo job.
 */
export class CreateJobDto {
  @ApiProperty({
    enum: JobType,
    example: JobType.DELAY_DEMO,
    description: 'Tipo de job; debe tener un handler registrado.',
  })
  @IsEnum(JobType)
  type: JobType;

  @ApiPropertyOptional({
    description: 'Payload de entrada que recibirá el handler.',
    example: { delayMs: 500 },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Prioridad en la cola (menor número = mayor prioridad).',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Número máximo de intentos antes de marcarlo como fallido.',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxAttempts?: number;
}
