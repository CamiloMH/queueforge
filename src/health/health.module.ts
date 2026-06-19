import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { QueueModule } from '../queue/queue.module';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

/**
 * Módulo de salud: expone `GET /health` con chequeos de MariaDB y Redis.
 */
@Module({
  imports: [TerminusModule, QueueModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
