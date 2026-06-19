import { BadRequestException, HttpException } from '@nestjs/common';

import { JobNotFoundException } from '../exceptions/job-not-found.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  /** Construye un ArgumentsHost simulado capturando status y json. */
  const buildHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/jobs', method: 'POST' }),
      }),
    };
    return { host, status, json };
  };

  it('mapea una HttpException a su status y mensaje', () => {
    const { host, status, json } = buildHost();

    filter.catch(new BadRequestException('payload inválido'), host as never);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/jobs',
        message: 'payload inválido',
      }),
    );
  });

  it('incluye statusCode y errorCode en errores de dominio', () => {
    const { host, status, json } = buildHost();

    filter.catch(new JobNotFoundException('job-1'), host as never);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        errorCode: 'JOB_NOT_FOUND',
        message: 'Job job-1 was not found.',
      }),
    );
  });

  it('usa la respuesta completa cuando la excepción no trae campo message', () => {
    const { host, status, json } = buildHost();

    filter.catch(new HttpException({ error: 'algo' }, 422), host as never);

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 422, message: { error: 'algo' } }),
    );
  });

  it('devuelve el texto cuando la excepción trae un string', () => {
    const { host, status, json } = buildHost();

    filter.catch(new HttpException('texto plano', 418), host as never);

    expect(status).toHaveBeenCalledWith(418);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'texto plano' }),
    );
  });

  it('mapea un error desconocido a 500', () => {
    const { host, status, json } = buildHost();

    filter.catch(new Error('boom'), host as never);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });
});
