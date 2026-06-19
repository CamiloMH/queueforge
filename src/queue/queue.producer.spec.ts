import { QueueProducer } from './queue.producer';

describe('QueueProducer', () => {
  let queue: {
    add: jest.Mock;
    getJob: jest.Mock;
    upsertJobScheduler: jest.Mock;
    removeJobScheduler: jest.Mock;
  };
  let producer: QueueProducer;

  beforeEach(() => {
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'bull-1' }),
      getJob: jest.fn(),
      upsertJobScheduler: jest.fn().mockResolvedValue(undefined),
      removeJobScheduler: jest.fn().mockResolvedValue(undefined),
    };
    const config = { queue: { backoffMs: 1000, maxAttempts: 3 } };
    producer = new QueueProducer(queue as never, config as never);
  });

  it('encola un job con sus opciones y devuelve el id de BullMQ', async () => {
    const job = {
      id: 'job-1',
      type: 'delay-demo',
      payload: { a: 1 },
      priority: 2,
      maxAttempts: 5,
    };

    const id = await producer.enqueue(job as never);

    expect(id).toBe('bull-1');
    expect(queue.add).toHaveBeenCalledWith(
      'delay-demo',
      { jobId: 'job-1', type: 'delay-demo', payload: { a: 1 } },
      expect.objectContaining({
        attempts: 5,
        priority: 2,
        backoff: { type: 'exponential', delay: 1000 },
      }),
    );
  });

  it('cancela un job presente en la cola', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    queue.getJob.mockResolvedValue({ remove });

    await producer.cancel('bull-1');

    expect(remove).toHaveBeenCalled();
  });

  it('no falla al cancelar un job inexistente', async () => {
    queue.getJob.mockResolvedValue(null);

    await expect(producer.cancel('missing')).resolves.toBeUndefined();
  });

  it('registra un schedule como repeatable job', async () => {
    const schedule = {
      id: 'sch-1',
      type: 'delay-demo',
      payload: {},
      cronExpression: '* * * * *',
      timezone: 'UTC',
    };

    await producer.upsertSchedule(schedule as never);

    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      'sch-1',
      { pattern: '* * * * *', tz: 'UTC' },
      expect.objectContaining({
        name: 'delay-demo',
        data: expect.objectContaining({ scheduleId: 'sch-1' }),
      }),
    );
  });

  it('elimina el repeatable job de un schedule', async () => {
    await producer.removeSchedule('sch-1');

    expect(queue.removeJobScheduler).toHaveBeenCalledWith('sch-1');
  });
});
