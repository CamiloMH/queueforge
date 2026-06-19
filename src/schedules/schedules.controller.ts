import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Schedule } from '../persistence/entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

/**
 * API REST de schedules (jobs recurrentes / cron).
 */
@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  /** Crea un schedule. */
  @Post()
  @ApiOperation({ summary: 'Crea un job recurrente (cron).' })
  create(@Body() dto: CreateScheduleDto): Promise<Schedule> {
    return this.schedules.create(dto);
  }

  /** Lista todos los schedules. */
  @Get()
  @ApiOperation({ summary: 'Lista todos los schedules.' })
  findAll(): Promise<Schedule[]> {
    return this.schedules.findAll();
  }

  /** Obtiene un schedule por id. */
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un schedule por su id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Schedule> {
    return this.schedules.findOne(id);
  }

  /** Activa o desactiva un schedule. */
  @Patch(':id')
  @ApiOperation({ summary: 'Activa o desactiva un schedule.' })
  setEnabled(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<Schedule> {
    return this.schedules.setEnabled(id, dto.enabled);
  }

  /** Elimina un schedule. */
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina un schedule y su job recurrente.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.schedules.remove(id);
  }
}
