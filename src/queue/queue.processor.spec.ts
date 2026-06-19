import { ExecutionStatus } from '../persistence/enums/execution-status.enum';
import { JobStatus } from '../persistence/enums/job-status.enum';
import { QueueProcessor } from './queue.processor';

/** Job de dominio de referencia usado en las pruebas. */
const domainJob = {
  id: 'job-1',
  type: 'delay-demo',
  payload: { delayMs: 0 },
  maxAttempts: 3,
};

describe('QueueProcessor', () => {
  let factory: { get: jest.Mock };
  let jobs: { findById: jest.Mock; create: jest.Mock; updateStatus: jest.Mock };
  let executions: { start: jest.Mock; finish: jest.Mock };
  let schedules: { update: jest.Mock };
  let processor: QueueProcessor;

  beforeEach(() => {
    factory = { get: jest.fn() };
    jobs = {
      findById: jest.fn().mockResolvedValue(domainJob),
      create: jest.fn().mockResolvedValue(domainJob),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    executions = {
      start: jest.fn().mockResolvedValue({ id: 'exec-1' }),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    schedules = { update: jest.fn().mockResolvedValue(undefined) };
    const config = {
      queue: { concurrency: 5, maxAttempts: 3, backoffMs: 1000 },
    };

    processor = new QueueProcessor(
      factory as never,
      jobs as never,
      executions as never,
      schedules as never,
      config as never,
    );
  });

  /** Construye un job de BullMQ de prueba. */
  const bullJob = (overrides: Record<string, unknown> = {}) =>
    ({
      data: { jobId: 'job-1', type: 'delay-demo', payload: { delayMs: 0 } },
      attemptsMade: 0,
      ...overrides,
    }) as never;

  it('ajusta la concurrencia del worker al arrancar', () => {
    const worker = { concurrency: 0 };
    // `WorkerHost.worker` es un getter; definimos una propiedad propia que lo sombrea.
    Object.defineProperty(processor, 'worker', {
      value: worker,
      configurable: true,
    });

    processor.onApplicationBootstrap();

    expect(worker.concurrency).toBe(5);
  });

  describe('eventos del worker', () => {
    const bullJob = {
      id: 'bull-1',
      data: { type: 'delay-demo' },
      attemptsMade: 0,
    } as never;

    it('registra inicio, fin y fallo de un job sin lanzar errores', () => {
      expect(() => processor.onActive(bullJob)).not.toThrow();
      expect(() => processor.onCompleted(bullJob)).not.toThrow();
      expect(() =>
        processor.onFailed(bullJob, new Error('boom')),
      ).not.toThrow();
    });

    it('tolera un job indefinido en el evento failed', () => {
      expect(() =>
        processor.onFailed(undefined, new Error('boom')),
      ).not.toThrow();
    });
  });

  it('ejecuta el handler y marca el job como completado', async () => {
    const handler = {
      type: 'delay-demo',
      execute: jest.fn().mockResolvedValue({ ok: true }),
    };
    factory.get.mockReturnValue(handler);

    const result = await processor.process(bullJob());

    expect(result).toEqual({ ok: true });
    expect(handler.execute).toHaveBeenCalledWith({ delayMs: 0 });
    expect(executions.start).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1', attempt: 1 }),
    );
    expect(jobs.updateStatus).toHaveBeenCalledWith('job-1', JobStatus.ACTIVE, {
      attemptsMade: 1,
    });
    expect(jobs.updateStatus).toHaveBeenCalledWith(
      'job-1',
      JobStatus.COMPLETED,
    );
    expect(executions.finish).toHaveBeenCalledWith(
      'exec-1',
      expect.objectContaining({ status: ExecutionStatus.COMPLETED }),
    );
  });

  it('registra el fallo y reencola cuando aún quedan intentos', async () => {
    const handler = {
      type: 'delay-demo',
      execute: jest.fn().mockRejectedValue(new Error('boom')),
    };
    factory.get.mockReturnValue(handler);

    await expect(
      processor.process(bullJob({ attemptsMade: 0 })),
    ).rejects.toThrow('boom');

    expect(executions.finish).toHaveBeenCalledWith(
      'exec-1',
      expect.objectContaining({
        status: ExecutionStatus.FAILED,
        error: 'boom',
      }),
    );
    expect(jobs.updateStatus).toHaveBeenLastCalledWith(
      'job-1',
      JobStatus.QUEUED,
    );
  });

  it('marca el job como fallido en el último intento', async () => {
    const handler = {
      type: 'delay-demo',
      execute: jest.fn().mockRejectedValue(new Error('boom')),
    };
    factory.get.mockReturnValue(handler);

    await expect(
      processor.process(bullJob({ attemptsMade: 2 })),
    ).rejects.toThrow('boom');

    expect(jobs.updateStatus).toHaveBeenLastCalledWith(
      'job-1',
      JobStatus.FAILED,
    );
  });

  it('crea el job de dominio y registra el disparo cuando proviene de un schedule', async () => {
    const handler = {
      type: 'delay-demo',
      execute: jest.fn().mockResolvedValue(undefined),
    };
    factory.get.mockReturnValue(handler);

    await processor.process(
      bullJob({
        data: { scheduleId: 'sch-1', type: 'delay-demo', payload: {} },
      }),
    );

    expect(jobs.findById).not.toHaveBeenCalled();
    expect(jobs.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'delay-demo' }),
    );
    expect(schedules.update).toHaveBeenCalledWith(
      'sch-1',
      expect.objectContaining({ lastRunAt: expect.any(Date) }),
    );
  });
});
