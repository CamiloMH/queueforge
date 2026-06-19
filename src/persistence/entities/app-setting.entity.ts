import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { SettingKey } from '../enums/setting-key.enum';

/**
 * Ajuste de configuración persistido (clave-valor).
 *
 * Permite sobreescribir en caliente, desde la base de datos, ciertos parámetros de
 * la aplicación (p. ej. el cron del despachador) sin necesidad de redeploy.
 */
@Entity({ name: 'settings' })
export class AppSetting {
  /** Clave única del ajuste (del catálogo {@link SettingKey}). */
  @PrimaryColumn({ type: 'enum', enum: SettingKey })
  key: SettingKey;

  /** Valor del ajuste (p. ej. una expresión cron). */
  @Column({ type: 'varchar', length: 100 })
  value: string;

  /** Fecha de última actualización. */
  @UpdateDateColumn()
  updatedAt: Date;
}
