import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Datos para habilitar o deshabilitar un schedule.
 */
export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Activa (true) o desactiva (false) el schedule.',
  })
  @IsBoolean()
  enabled: boolean;
}
