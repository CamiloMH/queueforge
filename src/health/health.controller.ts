import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { RedisHealthIndicator } from './redis.health';

/**
 * Endpoint de salud (liveness/readiness) para orquestadores en cada ambiente.
 */
@ApiTags('health')
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  /** Comprueba la conectividad con MariaDB y Redis. */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Comprueba el estado de MariaDB y Redis.' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.database.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
