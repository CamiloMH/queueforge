import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigService } from '../config/app-config.service';
import { AppSetting } from './entities/app-setting.entity';
import { JobExecution } from './entities/job-execution.entity';
import { Job } from './entities/job.entity';
import { Schedule } from './entities/schedule.entity';
import { JobExecutionRepository } from './repositories/job-execution.repository';
import { JobRepository } from './repositories/job.repository';
import { ScheduleRepository } from './repositories/schedule.repository';
import { SettingRepository } from './repositories/setting.repository';

/**
 * Módulo de persistencia.
 *
 * Configura la conexión a MariaDB con TypeORM (a partir de {@link AppConfigService})
 * y expone los repositorios de dominio. Centraliza el acceso a datos para que el resto
 * de la aplicación no dependa directamente del ORM.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'mariadb',
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
        entities: [Job, JobExecution, Schedule, AppSetting],
        synchronize: config.database.synchronize,
        logging: config.database.logging,
        migrationsRun: false,
      }),
    }),
    TypeOrmModule.forFeature([Job, JobExecution, Schedule, AppSetting]),
  ],
  providers: [
    JobRepository,
    JobExecutionRepository,
    ScheduleRepository,
    SettingRepository,
  ],
  exports: [
    JobRepository,
    JobExecutionRepository,
    ScheduleRepository,
    SettingRepository,
  ],
})
export class PersistenceModule {}
