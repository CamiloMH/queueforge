import { Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module';
import { QueueModule } from '../queue/queue.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

/**
 * Módulo de jobs: expone la API REST y orquesta persistencia y cola.
 */
@Module({
  imports: [PersistenceModule, QueueModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
