import { InvalidCronExpressionException } from '../common/exceptions/invalid-cron-expression.exception';
import { ScheduleNameTakenException } from '../common/exceptions/schedule-name-taken.exception';
import { ScheduleNotFoundException } from '../common/exceptions/schedule-not-found.exception';
import { UnknownJobTypeException } from '../common/exceptions/unknown-job-type.exception';
import { JobType } from '../persistence/enums/job-type.enum';
import { SchedulesService } from './schedules.service';

describe('SchedulesService', () => {
  let schedules: {
    create: jest.Mock;
    findById: jest.Mock;
    findByName: jest.Mock;
    findAll: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let producer: {
    upsertSchedule: jest.Mock;
    removeSchedule: jest.Mock;
  };
  let factory: { supports: jest.Mock; supportedTypes: string[] };
  let service: SchedulesService;

  const validDto = {
    name: 'limpieza',
    type: JobType.DELAY_DEMO,
    cronExpression: '*/5 * * * *',
  };

  beforeEach(() => {
    schedules = {
      create: jest
        .fn()
        .mockImplementation((input) => ({ id: 'sch-1', ...input })),
      findById: jest.fn(),
      findByName: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    producer = {
      upsertSchedule: jest.fn().mockResolvedValue(undefined),
      removeSchedule: jest.fn().mockResolvedValue(undefined),
    };
    factory = {
      supports: jest.fn().mockReturnValue(true),
      supportedTypes: [JobType.DELAY_DEMO],
    };

    service = new SchedulesService(
      schedules as never,
      producer as never,
      factory as never,
    );
  });

  describe('create', () => {
    it('crea el schedule y registra el repeatable job cuando está activo', async () => {
      const result = await service.create(validDto);

      expect(schedules.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'limpieza',
          enabled: true,
          timezone: 'UTC',
        }),
      );
      expect(producer.upsertSchedule).toHaveBeenCalledWith(result);
    });

    it('no registra en BullMQ si el schedule arranca desactivado', async () => {
      await service.create({ ...validDto, enabled: false });

      expect(producer.upsertSchedule).not.toHaveBeenCalled();
      expect(producer.removeSchedule).toHaveBeenCalled();
    });

    it('rechaza un tipo sin handler', async () => {
      factory.supports.mockReturnValue(false);

      await expect(service.create(validDto)).rejects.toThrow(
        UnknownJobTypeException,
      );
      expect(schedules.create).not.toHaveBeenCalled();
    });

    it('rechaza una expresión cron inválida', async () => {
      await expect(
        service.create({ ...validDto, cronExpression: 'cada rato' }),
      ).rejects.toThrow(InvalidCronExpressionException);
    });

    it('rechaza un nombre duplicado', async () => {
      schedules.findByName.mockResolvedValue({ id: 'otro' });

      await expect(service.create(validDto)).rejects.toThrow(
        ScheduleNameTakenException,
      );
    });
  });

  describe('findAll', () => {
    it('devuelve todos los schedules', async () => {
      schedules.findAll.mockResolvedValue([{ id: 'sch-1' }]);

      await expect(service.findAll()).resolves.toHaveLength(1);
    });
  });

  describe('setEnabled', () => {
    it('desactiva el schedule y elimina el repeatable job', async () => {
      schedules.findById.mockResolvedValue({ id: 'sch-1', enabled: true });

      await service.setEnabled('sch-1', false);

      expect(schedules.update).toHaveBeenCalledWith('sch-1', {
        enabled: false,
      });
      expect(producer.removeSchedule).toHaveBeenCalledWith('sch-1');
    });

    it('lanza NotFound si el schedule no existe', async () => {
      schedules.findById.mockResolvedValue(null);

      await expect(service.setEnabled('missing', true)).rejects.toThrow(
        ScheduleNotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('elimina el schedule y su repeatable job', async () => {
      schedules.findById.mockResolvedValue({ id: 'sch-1' });

      await service.remove('sch-1');

      expect(producer.removeSchedule).toHaveBeenCalledWith('sch-1');
      expect(schedules.delete).toHaveBeenCalledWith('sch-1');
    });
  });
});
