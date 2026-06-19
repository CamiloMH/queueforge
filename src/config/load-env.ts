import { config as loadDotenv } from 'dotenv';

/**
 * Carga las variables de entorno del archivo correspondiente al `NODE_ENV` activo
 * antes de que arranque Nest o el DataSource de TypeORM (CLI de migraciones).
 *
 * Importar este módulo produce el efecto secundario de poblar `process.env`. Debe
 * importarse de primero (antes que cualquier módulo que lea configuración en tiempo
 * de import). `dotenv` no sobrescribe variables ya definidas, por lo que las del
 * entorno real (Docker/CI) tienen prioridad sobre los archivos `.env`.
 */
const environment = process.env.NODE_ENV ?? 'development';

loadDotenv({ path: `.env.${environment}` });
loadDotenv();
