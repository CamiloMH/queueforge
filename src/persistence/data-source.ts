import '../config/load-env';

import { DataSource, DataSourceOptions } from 'typeorm';

import { configuration } from '../config/configuration';
import { AppSetting } from './entities/app-setting.entity';
import { JobExecution } from './entities/job-execution.entity';
import { Job } from './entities/job.entity';
import { Schedule } from './entities/schedule.entity';

const { database } = configuration();

/**
 * Opciones del DataSource compartidas por la CLI de TypeORM (migraciones).
 *
 * La app en runtime construye opciones equivalentes en `PersistenceModule` a partir
 * de {@link AppConfigService}; aquí se leen de `process.env` porque la CLI corre fuera
 * del contenedor de Nest.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'mariadb',
  host: database.host,
  port: database.port,
  username: database.username,
  password: database.password,
  database: database.database,
  entities: [Job, JobExecution, Schedule, AppSetting],
  migrations: ['src/persistence/migrations/*.ts'],
  synchronize: false,
  logging: database.logging,
};

/** DataSource por defecto usado por los scripts `typeorm migration:*`. */
export default new DataSource(dataSourceOptions);
