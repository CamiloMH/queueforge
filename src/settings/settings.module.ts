import { Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module';
import { SettingsService } from './settings.service';

/**
 * Módulo de ajustes configurables (clave-valor en base de datos).
 */
@Module({
  imports: [PersistenceModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
