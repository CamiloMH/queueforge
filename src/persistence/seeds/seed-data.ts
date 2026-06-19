import { DeepPartial } from 'typeorm';

import { AppSetting } from '../entities/app-setting.entity';
import { JobExecution } from '../entities/job-execution.entity';
import { Job } from '../entities/job.entity';
import { Schedule } from '../entities/schedule.entity';
import { ExecutionStatus } from '../enums/execution-status.enum';
import { JobStatus } from '../enums/job-status.enum';
import { JobType } from '../enums/job-type.enum';
import { SettingKey } from '../enums/setting-key.enum';

/**
 * Identificadores fijos de los jobs de ejemplo.
 *
 * Son UUIDs válidos (los acepta `GET /v1/jobs/:id`) y constantes, de modo que el seed
 * es reproducible y reejecutable.
 */
export const SEED_JOB_IDS = {
  completedDelay: '11111111-1111-4111-8111-111111111111',
  failedWebhook: '22222222-2222-4222-8222-222222222222',
  pendingDelay: '33333333-3333-4333-8333-333333333333',
  cancelledWebhook: '44444444-4444-4444-8444-444444444444',
  completedWebhook: '55555555-5555-4555-8555-555555555555',
  pendingDelay2: '66666666-6666-4666-8666-666666666666',
  pendingDelay3: '77777777-7777-4777-8777-777777777777',
} as const;

/** Identificador de la instancia ficticia que "ejecutó" las pruebas. */
const SEED_WORKER_ID = 'queueforge-seed';

/** Jobs de ejemplo, cubriendo los principales estados del ciclo de vida. */
export const seedJobs: DeepPartial<Job>[] = [
  {
    id: SEED_JOB_IDS.completedDelay,
    type: JobType.DELAY_DEMO,
    payload: { delayMs: 500 },
    status: JobStatus.COMPLETED,
    priority: 0,
    attemptsMade: 1,
    maxAttempts: 3,
    bullJobId: '1001',
  },
  {
    id: SEED_JOB_IDS.failedWebhook,
    type: JobType.HTTP_WEBHOOK,
    payload: { url: 'https://example.com/hook', method: 'POST' },
    status: JobStatus.FAILED,
    priority: 0,
    attemptsMade: 3,
    maxAttempts: 3,
    bullJobId: '1002',
  },
  {
    // Pendiente a propósito: el cron despachador lo encolará y el worker lo ejecutará.
    id: SEED_JOB_IDS.pendingDelay,
    type: JobType.DELAY_DEMO,
    payload: { delayMs: 1000 },
    status: JobStatus.PENDING,
    priority: 5,
    attemptsMade: 0,
    maxAttempts: 3,
    bullJobId: null,
  },
  {
    // Pendientes adicionales para ver actividad visible en la cola al arrancar.
    id: SEED_JOB_IDS.pendingDelay2,
    type: JobType.DELAY_DEMO,
    payload: { delayMs: 250 },
    status: JobStatus.PENDING,
    priority: 0,
    attemptsMade: 0,
    maxAttempts: 3,
    bullJobId: null,
  },
  {
    id: SEED_JOB_IDS.pendingDelay3,
    type: JobType.DELAY_DEMO,
    payload: { delayMs: 750 },
    status: JobStatus.PENDING,
    priority: 0,
    attemptsMade: 0,
    maxAttempts: 3,
    bullJobId: null,
  },
  {
    id: SEED_JOB_IDS.cancelledWebhook,
    type: JobType.HTTP_WEBHOOK,
    payload: { url: 'https://example.com/webhook' },
    status: JobStatus.CANCELLED,
    priority: 0,
    attemptsMade: 0,
    maxAttempts: 3,
    bullJobId: null,
  },
  {
    id: SEED_JOB_IDS.completedWebhook,
    type: JobType.HTTP_WEBHOOK,
    payload: {
      url: 'https://example.com/notify',
      method: 'POST',
      body: { ping: true },
    },
    status: JobStatus.COMPLETED,
    priority: 0,
    attemptsMade: 1,
    maxAttempts: 3,
    bullJobId: '1005',
  },
];

/** Historial de ejecuciones de ejemplo, vinculado a los jobs anteriores. */
export const seedExecutions: DeepPartial<JobExecution>[] = [
  {
    id: '1a1a1a1a-0001-4001-8001-000000000001',
    jobId: SEED_JOB_IDS.completedDelay,
    attempt: 1,
    status: ExecutionStatus.COMPLETED,
    startedAt: new Date('2026-06-18T12:00:00.000Z'),
    finishedAt: new Date('2026-06-18T12:00:00.503Z'),
    durationMs: 503,
    error: null,
    workerId: SEED_WORKER_ID,
  },
  {
    id: '2a2a2a2a-0001-4001-8001-000000000002',
    jobId: SEED_JOB_IDS.failedWebhook,
    attempt: 1,
    status: ExecutionStatus.FAILED,
    startedAt: new Date('2026-06-18T12:05:00.000Z'),
    finishedAt: new Date('2026-06-18T12:05:01.000Z'),
    durationMs: 1000,
    error: 'The webhook https://example.com/hook responded with status 500.',
    workerId: SEED_WORKER_ID,
  },
  {
    id: '2a2a2a2a-0002-4002-8002-000000000003',
    jobId: SEED_JOB_IDS.failedWebhook,
    attempt: 2,
    status: ExecutionStatus.FAILED,
    startedAt: new Date('2026-06-18T12:05:05.000Z'),
    finishedAt: new Date('2026-06-18T12:05:06.000Z'),
    durationMs: 1000,
    error: 'The webhook https://example.com/hook responded with status 500.',
    workerId: SEED_WORKER_ID,
  },
  {
    id: '2a2a2a2a-0003-4003-8003-000000000004',
    jobId: SEED_JOB_IDS.failedWebhook,
    attempt: 3,
    status: ExecutionStatus.FAILED,
    startedAt: new Date('2026-06-18T12:05:15.000Z'),
    finishedAt: new Date('2026-06-18T12:05:16.000Z'),
    durationMs: 1000,
    error: 'The webhook https://example.com/hook responded with status 500.',
    workerId: SEED_WORKER_ID,
  },
  {
    id: '5a5a5a5a-0001-4001-8001-000000000005',
    jobId: SEED_JOB_IDS.completedWebhook,
    attempt: 1,
    status: ExecutionStatus.COMPLETED,
    startedAt: new Date('2026-06-18T12:10:00.000Z'),
    finishedAt: new Date('2026-06-18T12:10:00.220Z'),
    durationMs: 220,
    error: null,
    workerId: SEED_WORKER_ID,
  },
];

/** Schedules (jobs recurrentes) de ejemplo. */
export const seedSchedules: DeepPartial<Schedule>[] = [
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    name: 'limpieza-cada-5-min',
    type: JobType.DELAY_DEMO,
    cronExpression: '*/5 * * * *',
    payload: { delayMs: 100 },
    enabled: true,
    timezone: 'UTC',
    lastRunAt: new Date('2026-06-18T12:05:00.000Z'),
    nextRunAt: new Date('2026-06-18T12:10:00.000Z'),
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    name: 'reporte-dias-laborales',
    type: JobType.HTTP_WEBHOOK,
    cronExpression: '0 9 * * 1-5',
    payload: { url: 'https://example.com/report' },
    enabled: false,
    timezone: 'America/Santiago',
    lastRunAt: null,
    nextRunAt: null,
  },
];

/**
 * Ajustes de ejemplo. Sembrar el cron del despachador en BD demuestra la configuración
 * en caliente (este valor tiene prioridad sobre la variable de entorno).
 */
export const seedSettings: DeepPartial<AppSetting>[] = [
  { key: SettingKey.DISPATCH_CRON, value: '*/10 * * * * *' },
];
