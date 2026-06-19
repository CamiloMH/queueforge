import './config/load-env';

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { setupOpenApi } from './docs/openapi.setup';

/**
 * Punto de entrada de la aplicación.
 *
 * Configura validación global de DTOs, versionado de la API por URI (`/v1`),
 * la documentación (ver {@link setupOpenApi}), el apagado controlado, y arranca el
 * servidor HTTP en el puerto configurado.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(AppConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableShutdownHooks();

  setupOpenApi(app);

  const { port } = config.app;
  await app.listen(port);
  Logger.log(
    `QueueForge escuchando en http://localhost:${port} · API en /v1 · docs en /docs`,
    'Bootstrap',
  );
}

void bootstrap();
