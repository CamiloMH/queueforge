import 'reflect-metadata';

import dataSource from '../data-source';
import { AppSetting } from '../entities/app-setting.entity';
import { JobExecution } from '../entities/job-execution.entity';
import { Job } from '../entities/job.entity';
import { Schedule } from '../entities/schedule.entity';
import {
  seedExecutions,
  seedJobs,
  seedSchedules,
  seedSettings,
} from './seed-data';

/**
 * Vacía las tablas de dominio respetando el orden de las claves foráneas
 * (las ejecuciones referencian a los jobs).
 */
async function clearAll(): Promise<void> {
  await dataSource.createQueryBuilder().delete().from(JobExecution).execute();
  await dataSource.createQueryBuilder().delete().from(Job).execute();
  await dataSource.createQueryBuilder().delete().from(Schedule).execute();
  await dataSource.createQueryBuilder().delete().from(AppSetting).execute();
}

/**
 * Puebla la base de datos con datos de ejemplo para explorar la aplicación.
 *
 * Es **idempotente**: limpia los datos previos y vuelve a insertar el set de ejemplo,
 * por lo que puede ejecutarse cuantas veces se quiera (`pnpm seed`).
 */
async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    await clearAll();
    await dataSource.getRepository(Job).save(seedJobs);
    await dataSource.getRepository(JobExecution).save(seedExecutions);
    await dataSource.getRepository(Schedule).save(seedSchedules);
    await dataSource.getRepository(AppSetting).save(seedSettings);
    console.log(
      `Seed completado: ${seedJobs.length} jobs, ${seedExecutions.length} ejecuciones, ` +
        `${seedSchedules.length} schedules, ${seedSettings.length} settings.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void seed().catch((error: unknown) => {
  console.error('Error al ejecutar el seed:', error);
  process.exitCode = 1;
});
