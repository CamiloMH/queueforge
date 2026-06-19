import { DuplicateJobTypeException } from '../common/exceptions/duplicate-job-type.exception';
import { UnknownJobTypeException } from '../common/exceptions/unknown-job-type.exception';
import { JobType } from '../persistence/enums/job-type.enum';
import { JobHandlerFactory } from './job-handler.factory';
import { JobHandler } from './job-handler.interface';

/** Crea un handler de prueba para un tipo dado. */
const makeHandler = (type: JobType): JobHandler => ({
  type,
  execute: jest.fn().mockResolvedValue(undefined),
});

describe('JobHandlerFactory', () => {
  it('resuelve el handler registrado para un tipo de job', () => {
    const delay = makeHandler(JobType.DELAY_DEMO);
    const factory = new JobHandlerFactory([
      delay,
      makeHandler(JobType.HTTP_WEBHOOK),
    ]);

    expect(factory.get(JobType.DELAY_DEMO)).toBe(delay);
  });

  it('lanza UnknownJobTypeException para un tipo no registrado', () => {
    const factory = new JobHandlerFactory([makeHandler(JobType.DELAY_DEMO)]);

    expect(() => factory.get(JobType.HTTP_WEBHOOK)).toThrow(
      UnknownJobTypeException,
    );
  });

  it('reporta los tipos soportados y si un tipo existe', () => {
    const factory = new JobHandlerFactory([makeHandler(JobType.DELAY_DEMO)]);

    expect(factory.supportedTypes).toEqual([JobType.DELAY_DEMO]);
    expect(factory.supports(JobType.DELAY_DEMO)).toBe(true);
    expect(factory.supports(JobType.HTTP_WEBHOOK)).toBe(false);
  });

  it('indica "none" en el error cuando no hay handlers registrados', () => {
    const factory = new JobHandlerFactory([]);

    expect(() => factory.get(JobType.DELAY_DEMO)).toThrow('none');
  });

  it('rechaza dos handlers con el mismo tipo', () => {
    expect(
      () =>
        new JobHandlerFactory([
          makeHandler(JobType.DELAY_DEMO),
          makeHandler(JobType.DELAY_DEMO),
        ]),
    ).toThrow(DuplicateJobTypeException);
  });
});
