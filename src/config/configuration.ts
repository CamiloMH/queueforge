import { Configuration, Environment } from './config.types';

/**
 * Construye el árbol de configuración tipado a partir de las variables de entorno
 * ya validadas por Joi.
 *
 * Se registra en `ConfigModule.forRoot({ load: [configuration] })` y queda accesible
 * de forma tipada a través de {@link AppConfigService}.
 *
 * @returns La configuración completa de la aplicación.
 */
export const configuration = (): Configuration => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    environment: (process.env.NODE_ENV as Environment) ?? 'development',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'queueforge',
    logging: process.env.DB_LOGGING === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  queue: {
    concurrency: Number(process.env.QUEUE_CONCURRENCY ?? 5),
    maxAttempts: Number(process.env.QUEUE_MAX_ATTEMPTS ?? 3),
    backoffMs: Number(process.env.QUEUE_BACKOFF_MS ?? 1000),
    dispatchCron: process.env.QUEUE_DISPATCH_CRON ?? '*/10 * * * * *',
  },
  rateLimit: {
    ttl: Number(process.env.RATE_LIMIT_TTL ?? 60000),
    limit: Number(process.env.RATE_LIMIT_LIMIT ?? 100),
  },
});
