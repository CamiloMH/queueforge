import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JobExecution } from '../persistence/entities/job-execution.entity';
import { Job } from '../persistence/entities/job.entity';
import { PaginatedJobs } from '../persistence/repositories/job.repository';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { JobsService } from './jobs.service';

/**
 * API REST de jobs: encolar, listar, consultar, ver historial y cancelar.
 */
@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  /** Encola un nuevo job. */
  @Post()
  @ApiOperation({ summary: 'Encola un nuevo job para su ejecución asíncrona.' })
  create(@Body() dto: CreateJobDto): Promise<Job> {
    return this.jobs.create(dto);
  }

  /** Lista jobs con filtros y paginación. */
  @Get()
  @ApiOperation({ summary: 'Lista jobs con filtros y paginación.' })
  findMany(@Query() query: QueryJobsDto): Promise<PaginatedJobs> {
    return this.jobs.findMany(query);
  }

  /** Obtiene un job por id. */
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un job por su id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Job> {
    return this.jobs.findOne(id);
  }

  /** Devuelve el historial de ejecuciones de un job. */
  @Get(':id/executions')
  @ApiOperation({ summary: 'Devuelve el historial de ejecuciones de un job.' })
  history(@Param('id', ParseUUIDPipe) id: string): Promise<JobExecution[]> {
    return this.jobs.getHistory(id);
  }

  /** Cancela un job pendiente o en cola. */
  @Delete(':id')
  @ApiOperation({ summary: 'Cancela un job pendiente o en cola.' })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<Job> {
    return this.jobs.cancel(id);
  }
}
