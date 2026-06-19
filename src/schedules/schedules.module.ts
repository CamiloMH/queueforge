import { Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module';
import { QueueModule } from '../queue/queue.module';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

/**
 * Módulo de schedules: API REST de jobs recurrentes (cron).
 */
@Module({
  imports: [PersistenceModule, QueueModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
