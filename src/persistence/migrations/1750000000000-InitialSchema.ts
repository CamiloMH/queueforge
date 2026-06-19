import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración inicial: crea las tablas `jobs`, `job_executions` y `schedules`.
 */
export class InitialSchema1750000000000 implements MigrationInterface {
  name = 'InitialSchema1750000000000';

  /** Crea el esquema. */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`jobs\` (
        \`id\` varchar(36) NOT NULL,
        \`type\` varchar(100) NOT NULL,
        \`payload\` json NOT NULL,
        \`status\` enum('pending','queued','active','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
        \`priority\` int NOT NULL DEFAULT 0,
        \`attemptsMade\` int NOT NULL DEFAULT 0,
        \`maxAttempts\` int NOT NULL DEFAULT 3,
        \`bullJobId\` varchar(100) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_jobs_type\` (\`type\`),
        INDEX \`IDX_jobs_status\` (\`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`job_executions\` (
        \`id\` varchar(36) NOT NULL,
        \`jobId\` varchar(36) NOT NULL,
        \`attempt\` int NOT NULL,
        \`status\` enum('running','completed','failed') NOT NULL DEFAULT 'running',
        \`startedAt\` datetime(3) NOT NULL,
        \`finishedAt\` datetime(3) NULL,
        \`durationMs\` int NULL,
        \`error\` text NULL,
        \`workerId\` varchar(100) NULL,
        INDEX \`IDX_executions_jobId\` (\`jobId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`schedules\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`type\` varchar(100) NOT NULL,
        \`cronExpression\` varchar(100) NOT NULL,
        \`payload\` json NOT NULL,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`timezone\` varchar(64) NOT NULL DEFAULT 'UTC',
        \`lastRunAt\` datetime(3) NULL,
        \`nextRunAt\` datetime(3) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_schedules_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`job_executions\`
      ADD CONSTRAINT \`FK_executions_job\`
      FOREIGN KEY (\`jobId\`) REFERENCES \`jobs\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  /** Revierte el esquema. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `job_executions` DROP FOREIGN KEY `FK_executions_job`',
    );
    await queryRunner.query('DROP TABLE `schedules`');
    await queryRunner.query('DROP TABLE `job_executions`');
    await queryRunner.query('DROP TABLE `jobs`');
  }
}
