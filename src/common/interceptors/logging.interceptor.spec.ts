import { of } from 'rxjs';

import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('deja pasar la respuesta del handler', (done) => {
    const interceptor = new LoggingInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/health' }),
      }),
    };
    const next = { handle: () => of('ok') };

    interceptor
      .intercept(context as never, next as never)
      .subscribe((value) => {
        expect(value).toBe('ok');
        done();
      });
  });
});
