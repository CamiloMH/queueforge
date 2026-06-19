# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.1.0] - 2026-06-19

### Added

- Motor de procesamiento de colas con **BullMQ** y concurrencia configurable por instancia.
- Persistencia e **historial de ejecuciones** en **MariaDB** mediante TypeORM (entidades
  `Job`, `JobExecution` y `Schedule` + migración inicial).
- **Handlers de job pluggables** (patrón Strategy + Factory) con dos ejemplos:
  `delay-demo` y `http-webhook`.
- **Jobs recurrentes (cron)** mediante repeatable jobs de BullMQ.
- **API REST** para encolar, listar, consultar, cancelar jobs y gestionar schedules.
  Todos los endpoints bajo `/v1` (p. ej. `/v1/jobs`). El health check (`/`) permanece
  neutral a la versión.
- **Despachador de cola** (cron interno) que reencola los jobs en estado `PENDING`,
  con reclamo atómico seguro entre instancias. Su frecuencia es configurable en caliente
  con precedencia base de datos (tabla `settings`, clave `queue.dispatch.cron`) →
  variable de entorno (`QUEUE_DISPATCH_CRON`) → valor por defecto.
- Tabla `settings` (clave-valor) y migración asociada para ajustes configurables en caliente.
- Enum `JobType` para el tipo de job: columnas `jobs.type` / `schedules.type` como `enum`
  en MariaDB, validación con `@IsEnum` en los DTOs y tipado en toda la cadena (handlers,
  factory, repositorios, seed).
- **Rate limiting** de la API con `@nestjs/throttler` (configurable vía `RATE_LIMIT_TTL` y
  `RATE_LIMIT_LIMIT`); `/` queda exento.
- Script de **seed idempotente** (`pnpm seed`) que puebla la BD con jobs en distintos
  estados, su historial de ejecuciones, schedules y ajustes de ejemplo.
- Documentación interactiva con **Scalar** (`/docs`) y documento OpenAPI (`/openapi.json`).
- **Health checks** de MariaDB y Redis (`/`) con `@nestjs/terminus`.
- **Configuración multi-ambiente** validada con Joi (fail-fast al arrancar si falta una variable).
- Filtro global de excepciones con respuestas uniformes (`statusCode`, `errorCode`, `message`
  en inglés) e interceptor de logging HTTP.
- Suite de **tests (TDD)** con cobertura **≥ 90 %** y **git hooks**
  (Husky + lint-staged + commitlint).
- **Logs del ciclo de vida del worker** (job en ejecución / completado / fallido).
