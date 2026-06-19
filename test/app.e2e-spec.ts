import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

/**
 * Pruebas end-to-end del flujo principal.
 *
 * Requieren MariaDB y Redis en marcha (p. ej. `docker compose up -d`) y el esquema
 * creado (`pnpm migration:run`, o `DB_SYNCHRONIZE=true` con una base de datos de test).
 */
describe('QueueForge (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) reporta el estado de las dependencias', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect([200, 503]).toContain(response.status);
    expect(response.body.status).toBeDefined();
  });

  it('/jobs (POST) encola un job y permite recuperarlo', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/jobs')
      .send({ type: 'delay-demo', payload: { delayMs: 10 } })
      .expect(201);

    expect(created.body.id).toBeDefined();

    const fetched = await request(app.getHttpServer())
      .get(`/v1/jobs/${created.body.id}`)
      .expect(200);

    expect(fetched.body.type).toBe('delay-demo');
  });

  it('/jobs (POST) rechaza un tipo que no está en el enum', async () => {
    await request(app.getHttpServer())
      .post('/v1/jobs')
      .send({ type: 'tipo-inexistente' })
      .expect(400);
  });
});
