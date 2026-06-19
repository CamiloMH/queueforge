import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import { configuration } from './configuration';
import { envValidationSchema } from './env.validation';

/**
 * Módulo de configuración global.
 *
 * Carga `.env.<NODE_ENV>` y `.env`, valida las variables con Joi y expone
 * {@link AppConfigService} de forma global para todo el contenedor de DI.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
