/**
 * Tipos de configuración fuertemente tipados de la aplicación.
 *
 * Centralizan la forma del árbol de configuración para que el resto del código
 * consuma valores tipados en lugar de leer `process.env` disperso (DRY).
 */

/** Entornos de ejecución soportados por la aplicación. */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/** Configuración general del servidor HTTP. */
export interface AppConfig {
  /** Puerto HTTP donde escucha la API. */
  readonly port: number;
  /** Entorno activo. */
  readonly environment: Environment;
}

/** Configuración de conexión a MariaDB. */
export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  /** Activa el log de SQL de TypeORM (recomendado solo en desarrollo). */
  readonly logging: boolean;
  /** Sincroniza el esquema automáticamente (solo para tests/e2e, nunca en producción). */
  readonly synchronize: boolean;
}

/** Configuración de conexión a Redis (backend de BullMQ). */
export interface RedisConfig {
  readonly host: string;
  readonly port: number;
  /** Contraseña opcional de Redis. */
  readonly password?: string;
}

/** Configuración del rate limiting (throttling) de la API HTTP. */
export interface RateLimitConfig {
  /** Ventana de tiempo en milisegundos. */
  readonly ttl: number;
  /** Número máximo de peticiones permitidas por ventana y por cliente. */
  readonly limit: number;
}

/** Configuración del motor de colas. */
export interface QueueConfig {
  /** Número máximo de jobs procesados en paralelo por instancia. */
  readonly concurrency: number;
  /** Reintentos máximos por job antes de marcarlo como fallido. */
  readonly maxAttempts: number;
  /** Backoff base (ms) entre reintentos. */
  readonly backoffMs: number;
  /**
   * Expresión cron del despachador que reencola los jobs pendientes.
   * Es el valor por defecto si no hay uno configurado en base de datos.
   */
  readonly dispatchCron: string;
}

/** Árbol de configuración completo de la aplicación. */
export interface Configuration {
  readonly app: AppConfig;
  readonly database: DatabaseConfig;
  readonly redis: RedisConfig;
  readonly queue: QueueConfig;
  readonly rateLimit: RateLimitConfig;
}
