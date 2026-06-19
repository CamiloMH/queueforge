import * as Joi from 'joi';

/**
 * Esquema de validación de variables de entorno.
 *
 * Si una variable falta o tiene un tipo inválido, la aplicación falla al arrancar
 * (fail-fast), evitando despliegues mal configurados en cualquiera de los N ambientes.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_DATABASE: Joi.string().required(),
  DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  QUEUE_CONCURRENCY: Joi.number().integer().min(1).default(5),
  QUEUE_MAX_ATTEMPTS: Joi.number().integer().min(1).default(3),
  QUEUE_BACKOFF_MS: Joi.number().integer().min(0).default(1000),
  QUEUE_DISPATCH_CRON: Joi.string().default('*/10 * * * * *'),

  RATE_LIMIT_TTL: Joi.number().integer().min(1).default(60000),
  RATE_LIMIT_LIMIT: Joi.number().integer().min(1).default(100),
});
