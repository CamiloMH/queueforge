import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppSetting } from '../entities/app-setting.entity';
import { SettingKey } from '../enums/setting-key.enum';

/**
 * Acceso a datos de los ajustes clave-valor ({@link AppSetting}).
 */
@Injectable()
export class SettingRepository {
  constructor(
    @InjectRepository(AppSetting) private readonly repo: Repository<AppSetting>,
  ) {}

  /**
   * Obtiene el valor de un ajuste.
   *
   * @param key - Clave del ajuste.
   * @returns El valor, o `null` si no existe.
   */
  async get(key: SettingKey): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? null;
  }

  /**
   * Crea o actualiza un ajuste.
   *
   * @param key - Clave del ajuste.
   * @param value - Valor a persistir.
   */
  async set(key: SettingKey, value: string): Promise<void> {
    await this.repo.save({ key, value });
  }
}
