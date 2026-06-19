import { JobStatus } from '../persistence/enums/job-status.enum';
import { QueueDispatcherService } from './queue-dispatcher.service';

const cronJobMock = { start: jest.fn(), stop: jest.fn() };
jest.mock('cron', () => ({
  CronJob: { from: jest.fn(() => cronJobMock) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CronJob } = require('cron') as { CronJob: { from: jest.Mock } };

describe('QueueDispatcherService', () => {
  let jobs: {
    findPending: jest.Mock;
    claimForDispatch: jest.Mock;
    findById: jest.Mock;
    setBullJobId: jest.Mock;
    updateStatus: jest.Mock;
  };
  let producer: { enqueue: jest.Mock };
  let settings: { getDispatchCron: jest.Mock };
  let scheduler: {
    addCronJob: jest.Mock;
    deleteCronJob: jest.Mock;
    doesExist: jest.Mock;
  };
  let service: QueueDispatcherService;

  beforeEach(() => {
    jest.clearAllMocks();
    jobs = {
      findPending: jest.fn().mockResolvedValue([]),
      claimForDispatch: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
      setBullJobId: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    producer = { enqueue: jest.fn().mockResolvedValue('bull-1') };
    settings = {
      getDispatchCron: jest.fn().mockResolvedValue('*/10 * * * * *'),
    };
    scheduler = {
      addCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
      doesExist: jest.fn().mockReturnValue(false),
    };
    service = new QueueDispatcherService(
      jobs as never,
      producer as never,
      settings as never,
      scheduler as never,
    );
  });

  describe('schedule', () => {
    it('registra el cron con la expresión resuelta (BD/entorno)', async () => {
      await service.schedule();

      expect(settings.getDispatchCron).toHaveBeenCalled();
      expect(CronJob.from).toHaveBeenCalledWith(
        expect.objectContaining({ cronTime: '*/10 * * * * *' }),
      );
      expect(scheduler.addCronJob).toHaveBeenCalledWith(
        'queue-dispatch',
        cronJobMock,
      );
      expect(cronJobMock.start).toHaveBeenCalled();
    });

    it('reemplaza el cron previo si ya existía', async () => {
      scheduler.doesExist.mockReturnValue(true);

      await service.schedule();

      expect(scheduler.deleteCronJob).toHaveBeenCalledWith('queue-dispatch');
    });

    it('el onTick del cron dispara el despacho', async () => {
      await service.schedule();
      const onTick = CronJob.from.mock.calls[0][0].onTick as () => void;

      onTick();

      expect(jobs.findPending).toHaveBeenCalled();
    });
  });

  describe('ciclo de vida', () => {
    it('programa el cron al arrancar', async () => {
      await service.onApplicationBootstrap();

      expect(scheduler.addCronJob).toHaveBeenCalled();
    });

    it('elimina el cron al destruirse el módulo', () => {
      scheduler.doesExist.mockReturnValue(true);

      service.onModuleDestroy();

      expect(scheduler.deleteCronJob).toHaveBeenCalledWith('queue-dispatch');
    });
  });

  describe('dispatchPending', () => {
    it('reclama y encola cada job pendiente', async () => {
      jobs.findPending.mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }]);
      jobs.findById.mockImplementation((id: string) =>
        Promise.resolve({ id, type: 'delay-demo' }),
      );

      await service.dispatchPending();

      expect(jobs.claimForDispatch).toHaveBeenCalledTimes(2);
      expect(producer.enqueue).toHaveBeenCalledTimes(2);
      expect(jobs.setBullJobId).toHaveBeenCalledWith('job-1', 'bull-1');
    });

    it('omite el job si desaparece tras reclamarlo', async () => {
      jobs.findPending.mockResolvedValue([{ id: 'job-1' }]);
      jobs.claimForDispatch.mockResolvedValue(true);
      jobs.findById.mockResolvedValue(null);

      await service.dispatchPending();

      expect(producer.enqueue).not.toHaveBeenCalled();
    });

    it('omite un job que otra instancia ya reclamó', async () => {
      jobs.findPending.mockResolvedValue([{ id: 'job-1' }]);
      jobs.claimForDispatch.mockResolvedValue(false);

      await service.dispatchPending();

      expect(producer.enqueue).not.toHaveBeenCalled();
    });

    it('devuelve el job a PENDING si el encolado falla', async () => {
      jobs.findPending.mockResolvedValue([{ id: 'job-1' }]);
      jobs.findById.mockResolvedValue({ id: 'job-1', type: 'delay-demo' });
      producer.enqueue.mockRejectedValue(new Error('redis down'));

      await service.dispatchPending();

      expect(jobs.updateStatus).toHaveBeenCalledWith(
        'job-1',
        JobStatus.PENDING,
      );
      expect(jobs.setBullJobId).not.toHaveBeenCalled();
    });

    it('no procesa nada si ya hay un tick en curso', async () => {
      (service as unknown as { isDispatching: boolean }).isDispatching = true;

      await service.dispatchPending();

      expect(jobs.findPending).not.toHaveBeenCalled();
    });
  });
});
