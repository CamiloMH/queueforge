import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Convierte la columna `type` de `jobs` y `schedules` de `varchar` a `enum`,
 * alineándola con el catálogo {@link JobType}.
 */
export class JobTypeToEnum1750000200000 implements MigrationInterface {
  name = 'JobTypeToEnum1750000200000';

  /** Cambia las columnas a enum. */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `jobs` MODIFY COLUMN `type` enum('delay-demo','http-webhook') NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `schedules` MODIFY COLUMN `type` enum('delay-demo','http-webhook') NOT NULL",
    );
  }

  /** Revierte las columnas a varchar. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `schedules` MODIFY COLUMN `type` varchar(100) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `jobs` MODIFY COLUMN `type` varchar(100) NOT NULL',
    );
  }
}
