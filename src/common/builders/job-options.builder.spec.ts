import { JobOptionsBuilder } from './job-options.builder';

describe('JobOptionsBuilder', () => {
  it('construye opciones con prioridad, intentos y backoff exponencial', () => {
    const options = new JobOptionsBuilder()
      .withPriority(5)
      .withAttempts(3)
      .withExponentialBackoff(1000)
      .withRemoveOnComplete(100)
      .build();

    expect(options).toEqual({
      priority: 5,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
    });
  });

  it('omite la prioridad cuando es undefined', () => {
    const options = new JobOptionsBuilder()
      .withPriority(undefined)
      .withAttempts(1)
      .build();

    expect(options).not.toHaveProperty('priority');
    expect(options.attempts).toBe(1);
  });

  it('devuelve una copia independiente en cada build', () => {
    const builder = new JobOptionsBuilder().withAttempts(2);

    const first = builder.build();
    const second = builder.build();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});
