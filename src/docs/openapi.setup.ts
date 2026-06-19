import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';

/** Ruta donde se expone el documento OpenAPI en formato JSON. */
const OPENAPI_JSON_PATH = '/openapi.json';
/** Ruta donde se sirve la documentación interactiva (Scalar). */
const DOCS_PATH = '/docs';

/**
 * Construye el documento OpenAPI de la API a partir de los controladores y DTOs.
 *
 * @param app - Aplicación Nest ya creada.
 * @returns El documento OpenAPI.
 */
function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('QueueForge')
    .setDescription(
      'Microservicio procesador de colas: ejecuta jobs con concurrencia, ' +
        'mantiene historial y soporta jobs recurrentes (cron).',
    )
    .setVersion('0.1.0')
    .addTag('jobs')
    .addTag('schedules')
    .addTag('health')
    .build();
  return SwaggerModule.createDocument(app, config);
}

/**
 * Configura la documentación de la API:
 * - expone el documento OpenAPI en `/openapi.json`,
 * - sirve la UI interactiva de Scalar en `/docs`.
 *
 * @param app - Aplicación Nest (adaptador Express).
 */
export function setupOpenApi(app: NestExpressApplication): void {
  const document = buildOpenApiDocument(app);

  app
    .getHttpAdapter()
    .get(OPENAPI_JSON_PATH, (_req: Request, res: Response) => {
      res.json(document);
    });
  app.use(DOCS_PATH, apiReference({ content: document }));
}
