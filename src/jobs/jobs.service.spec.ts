import { JobNotCancellableException } from '../common/exceptions/job-not-cancellable.exception';
import { JobNotFoundException } from '../common/exceptions/job-not-found.exception';
import { UnknownJobTypeException } from '../common/exceptions/unknown-job-type.exception';
import { JobStatus } from '../persistence/enums/job-status.enum';
import { JobType } from '../persistence/enums/job-type.enum';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let jobs: {
    create: jest.Mock;
    findById: jest.Mock;
    findMany: jest.Mock;
    markQueued: jest.Mock;
    updateStatus: jest.Mock;
  };
  let executions: { findByJobId: jest.Mock };
  let producer: { enqueue: jest.Mock; cancel: jest.Mock };
  let factory: { supports: jest.Mock; supportedTypes: string[] };
  let config: { queue: { maxAttempts: number } };
  let service: JobsService;

  beforeEach(() => {
    jobs = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      markQueued: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    executions = { findByJobId: jest.fn().mockResolvedValue([]) };
    producer = {
      enqueue: jest.fn().mockResolvedValue('bull-1'),
      cancel: jest.fn().mockResolvedValue(undefined),
    };
    factory = {
      supports: jest.fn().mockReturnValue(true),
      supportedTypes: [JobType.DELAY_DEMO],
    };
    config = { queue: { maxAttempts: 3 } };

    service = new JobsService(
      jobs as never,
      executions as never,
      producer as never,
      factory as never,
      config as never,
    );
  });

  describe('create', () => {
    it('persiste el job, lo encola y lo marca como QUEUED', async () => {
      jobs.create.mockResolvedValue({
        id: 'job-1',
        type: 'delay-demo',
        payload: {},
      });

      const result = await service.create({
        type: JobType.DELAY_DEMO,
        payload: { delayMs: 0 },
      });

      expect(jobs.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: JobType.DELAY_DEMO, maxAttempts: 3 }),
      );
      expect(producer.enqueue).toHaveBeenCalled();
      expect(jobs.markQueued).toHaveBeenCalledWith('job-1', 'bull-1');
      expect(result.status).toBe(JobStatus.QUEUED);
      expect(result.bullJobId).toBe('bull-1');
    });

    it('rechaza tipos sin handler registrado y no encola', async () => {
      factory.supports.mockReturnValue(false);

      await expect(
        service.create({ type: JobType.HTTP_WEBHOOK }),
      ).rejects.toThrow(UnknownJobTypeException);
      expect(jobs.create).not.toHaveBeenCalled();
      expect(producer.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('findMany', () => {
    it('aplica paginación por defecto cuando no se indica', async () => {
      jobs.findMany.mockResolvedValue({ items: [], total: 0 });

      await service.findMany({});

      expect(jobs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('respeta la página, el límite y los filtros indicados', async () => {
      jobs.findMany.mockResolvedValue({ items: [], total: 0 });

      await service.findMany({ page: 3, limit: 10, type: JobType.DELAY_DEMO });

      expect(jobs.findMany).toHaveBeenCalledWith({
        status: undefined,
        type: JobType.DELAY_DEMO,
        skip: 20,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('lanza NotFound cuando el job no existe', async () => {
      jobs.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        JobNotFoundException,
      );
    });
  });

  describe('getHistory', () => {
    it('devuelve el historial tras comprobar que el job existe', async () => {
      jobs.findById.mockResolvedValue({ id: 'job-1' });
      executions.findByJobId.mockResolvedValue([{ id: 'exec-1' }]);

      const history = await service.getHistory('job-1');

      expect(executions.findByJobId).toHaveBeenCalledWith('job-1');
      expect(history).toHaveLength(1);
    });
  });

  describe('cancel', () => {
    it('cancela un job en cola y lo elimina de BullMQ', async () => {
      jobs.findById.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.QUEUED,
        bullJobId: 'bull-1',
      });

      const result = await service.cancel('job-1');

      expect(producer.cancel).toHaveBeenCalledWith('bull-1');
      expect(jobs.updateStatus).toHaveBeenCalledWith(
        'job-1',
        JobStatus.CANCELLED,
      );
      expect(result.status).toBe(JobStatus.CANCELLED);
    });

    it('no permite cancelar un job ya finalizado', async () => {
      jobs.findById.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.COMPLETED,
      });

      await expect(service.cancel('job-1')).rejects.toThrow(
        JobNotCancellableException,
      );
      expect(producer.cancel).not.toHaveBeenCalled();
    });
  });
});
