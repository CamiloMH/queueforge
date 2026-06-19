import { SettingKey } from '../persistence/enums/setting-key.enum';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let repo: { get: jest.Mock; set: jest.Mock };
  let config: { queue: { dispatchCron: string } };
  let service: SettingsService;

  beforeEach(() => {
    repo = { get: jest.fn(), set: jest.fn().mockResolvedValue(undefined) };
    config = { queue: { dispatchCron: '*/10 * * * * *' } };
    service = new SettingsService(repo as never, config as never);
  });

  it('devuelve el cron de la base de datos cuando existe', async () => {
    repo.get.mockResolvedValue('*/30 * * * * *');

    await expect(service.getDispatchCron()).resolves.toBe('*/30 * * * * *');
    expect(repo.get).toHaveBeenCalledWith(SettingKey.DISPATCH_CRON);
  });

  it('usa la configuración (entorno/default) cuando no hay valor en BD', async () => {
    repo.get.mockResolvedValue(null);

    await expect(service.getDispatchCron()).resolves.toBe('*/10 * * * * *');
  });

  it('persiste el cron en base de datos', async () => {
    await service.setDispatchCron('0 * * * * *');

    expect(repo.set).toHaveBeenCalledWith(
      SettingKey.DISPATCH_CRON,
      '0 * * * * *',
    );
  });
});
