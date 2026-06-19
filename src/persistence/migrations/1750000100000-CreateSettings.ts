import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla `settings` (ajustes clave-valor configurables en caliente).
 */
export class CreateSettings1750000100000 implements MigrationInterface {
  name = 'CreateSettings1750000100000';

  /** Crea la tabla. */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`settings\` (
        \`key\` enum('queue.dispatch.cron') NOT NULL,
        \`value\` varchar(100) NOT NULL,
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB
    `);
  }

  /** Elimina la tabla. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `settings`');
  }
}
