import { InvalidJobPayloadException } from '../../common/exceptions/invalid-job-payload.exception';
import { HttpWebhookHandler } from './http-webhook.handler';

describe('HttpWebhookHandler', () => {
  let handler: HttpWebhookHandler;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    handler = new HttpWebhookHandler();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('realiza una petición POST a la url y devuelve el status', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const result = await handler.execute({ url: 'https://example.com/hook' });

    expect(result).toEqual({ status: 200 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/hook',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('usa el método indicado y no envía cuerpo en GET', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204 });

    const result = await handler.execute({
      url: 'https://example.com',
      method: 'get',
      headers: { 'x-token': '1' },
    });

    expect(result).toEqual({ status: 204 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'GET',
        body: undefined,
        headers: expect.objectContaining({ 'x-token': '1' }),
      }),
    );
  });

  it('falla cuando la respuesta no es satisfactoria', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(
      handler.execute({ url: 'https://example.com/hook' }),
    ).rejects.toThrow(/status 500/);
  });

  it('exige una url válida en el payload', async () => {
    await expect(handler.execute({})).rejects.toThrow(
      InvalidJobPayloadException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
