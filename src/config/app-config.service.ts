import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AppConfig,
  Configuration,
  DatabaseConfig,
  QueueConfig,
  RateLimitConfig,
  RedisConfig,
} from './config.types';

/**
 * Accesor tipado a la configuración de la aplicación.
 *
 * Envuelve a {@link ConfigService} para exponer getters fuertemente tipados y
 * evitar el uso de claves string mágicas dispersas por el código (DRY).
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Configuration, true>) {}

  /** Configuración general de la app (puerto, entorno). */
  get app(): AppConfig {
    return this.config.get('app', { infer: true });
  }

  /** Configuración de MariaDB. */
  get database(): DatabaseConfig {
    return this.config.get('database', { infer: true });
  }

  /** Configuración de Redis. */
  get redis(): RedisConfig {
    return this.config.get('redis', { infer: true });
  }

  /** Configuración del motor de colas. */
  get queue(): QueueConfig {
    return this.config.get('queue', { infer: true });
  }

  /** Configuración del rate limiting de la API. */
  get rateLimit(): RateLimitConfig {
    return this.config.get('rateLimit', { infer: true });
  }
}
