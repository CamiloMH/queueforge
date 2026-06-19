/**
 * Claves de los ajustes configurables persistidos en la tabla `settings`.
 *
 * Centraliza las claves como enum (en lugar de strings mágicos) para evitar typos y
 * documentar el catálogo de ajustes disponibles.
 */
export enum SettingKey {
  /** Expresión cron del despachador de la cola. */
  DISPATCH_CRON = 'queue.dispatch.cron',
}
