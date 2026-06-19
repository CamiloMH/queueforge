import { DelayDemoHandler } from './delay-demo.handler';

describe('DelayDemoHandler', () => {
  const handler = new DelayDemoHandler();

  it('expone el tipo "delay-demo"', () => {
    expect(handler.type).toBe('delay-demo');
  });

  it('espera el tiempo indicado y reporta los ms esperados', async () => {
    await expect(handler.execute({ delayMs: 0 })).resolves.toEqual({
      sleptMs: 0,
    });
  });

  it('normaliza valores negativos a 0', async () => {
    await expect(handler.execute({ delayMs: -10 })).resolves.toEqual({
      sleptMs: 0,
    });
  });

  it('usa la espera por defecto cuando no se indica delayMs', async () => {
    await expect(handler.execute({})).resolves.toEqual({ sleptMs: 100 });
  });

  it('trata valores no numéricos como 0', async () => {
    await expect(handler.execute({ delayMs: 'abc' })).resolves.toEqual({
      sleptMs: 0,
    });
  });

  it('acota esperas demasiado largas al máximo permitido', async () => {
    jest.useFakeTimers();
    try {
      const promise = handler.execute({ delayMs: 10_000_000 });
      await jest.advanceTimersByTimeAsync(60_000);
      await expect(promise).resolves.toEqual({ sleptMs: 60_000 });
    } finally {
      jest.useRealTimers();
    }
  });
});
