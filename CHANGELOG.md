# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Versionado de la API por URI: todos los endpoints cuelgan de `/v1` (p. ej. `/v1/jobs`).
  El health check (`/health`) permanece neutral a la versión.
- **Rate limiting** de la API con `@nestjs/throttler` (configurable vía `RATE_LIMIT_TTL` y
  `RATE_LIMIT_LIMIT`); `/health` queda exento.
- Script de **seed idempotente** (`pnpm seed`) que puebla la BD con jobs en distintos
  estados, su historial de ejecuciones y schedules de ejemplo.
- **Despachador de cola** (cron interno) que reencola los jobs en estado `PENDING`,
  con reclamo atómico seguro entre instancias. Su frecuencia es configurable en caliente
  con precedencia base de datos (tabla `settings`, clave `queue.dispatch.cron`) →
  variable de entorno (`QUEUE_DISPATCH_CRON`) → valor por defecto.
- Tabla `settings` (clave-valor) y migración asociada para ajustes configurables en caliente.
- Enum `JobType` para el tipo de job: columnas `jobs.type`/`schedules.type` como `enum`
  (migración `JobTypeToEnum`), validación con `@IsEnum` en los DTOs y tipado en toda la
  cadena (handlers, factory, repositorios, seed). Un tipo no soportado se rechaza con `400`.
- **Logs del ciclo de vida del worker** (job en ejecución / completado / fallido) y log de
  arranque con las URLs de la API y la documentación.
- Respuestas de error uniformes con `statusCode`, `errorCode` y `message` en inglés, a
  partir de una jerarquía de excepciones de dominio con status HTTP personalizados.

### Changed

- La documentación interactiva (Scalar) se sirve ahora en `/docs` (antes `/reference`).

## [0.1.0] - 2026-06-18

### Added

- Motor de procesamiento de colas con **BullMQ** y concurrencia configurable por instancia.
- Persistencia e **historial de ejecuciones** en **MariaDB** mediante TypeORM (entidades
  `Job`, `JobExecution` y `Schedule` + migración inicial).
- **Handlers de job pluggables** (patrón Strategy + Factory) con dos ejemplos:
  `delay-demo` y `http-webhook`.
- **Jobs recurrentes (cron)** mediante repeatable jobs de BullMQ.
- **API REST** para encolar, listar, consultar, cancelar jobs y gestionar schedules.
- Documentación interactiva con **Scalar** (`/reference`) y documento OpenAPI (`/openapi.json`).
- **Health checks** de MariaDB y Redis (`/health`) con `@nestjs/terminus`.
- **Configuración multi-ambiente** validada con Joi (fail-fast).
- Filtro global de excepciones e interceptor de logging.
- Suite de **tests (TDD)** con cobertura **≥ 90 %** y **git hooks** (Husky + lint-staged + commitlint).
