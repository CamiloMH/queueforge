import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';
import { SettingKey } from '../persistence/enums/setting-key.enum';
import { SettingRepository } from '../persistence/repositories/setting.repository';

/**
 * Servicio de ajustes configurables en caliente.
 *
 * Resuelve valores con la precedencia **base de datos → entorno → valor por defecto**,
 * permitiendo cambiar el comportamiento sin redeploy.
 */
@Injectable()
export class SettingsService {
  constructor(
    private readonly settings: SettingRepository,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Devuelve la expresión cron del despachador.
   *
   * @returns El valor de la BD si existe; en su defecto, el de la configuración
   * (variable de entorno o valor por defecto).
   */
  async getDispatchCron(): Promise<string> {
    const fromDb = await this.settings.get(SettingKey.DISPATCH_CRON);
    return fromDb ?? this.config.queue.dispatchCron;
  }

  /**
   * Persiste en base de datos la expresión cron del despachador.
   *
   * @param value - Nueva expresión cron.
   */
  async setDispatchCron(value: string): Promise<void> {
    await this.settings.set(SettingKey.DISPATCH_CRON, value);
  }
}
