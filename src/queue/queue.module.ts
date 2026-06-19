import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
// BullModule se re-exporta para que otros módulos (p. ej. Health) puedan inyectar la cola.

import { AppConfigService } from '../config/app-config.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { SettingsModule } from '../settings/settings.module';
import { DelayDemoHandler } from './handlers/delay-demo.handler';
import { HttpWebhookHandler } from './handlers/http-webhook.handler';
import { JobHandlerFactory } from './job-handler.factory';
import { JOB_HANDLERS } from './job-handler.interface';
import { QueueDispatcherService } from './queue-dispatcher.service';
import { QUEUE_NAME } from './queue.constants';
import { QueueProcessor } from './queue.processor';
import { QueueProducer } from './queue.producer';

/**
 * Módulo del motor de colas.
 *
 * Conecta BullMQ a Redis, registra la cola principal y cablea el productor, el worker
 * (processor) y las estrategias de ejecución (handlers) junto con su factory.
 *
 * Para añadir un nuevo tipo de job: crear un handler que implemente `JobHandler`,
 * declararlo como provider y añadirlo al array del provider {@link JOB_HANDLERS}.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
        },
      }),
    }),
    BullModule.registerQueue({ name: QUEUE_NAME }),
    PersistenceModule,
    SettingsModule,
  ],
  providers: [
    DelayDemoHandler,
    HttpWebhookHandler,
    {
      provide: JOB_HANDLERS,
      useFactory: (delay: DelayDemoHandler, webhook: HttpWebhookHandler) => [
        delay,
        webhook,
      ],
      inject: [DelayDemoHandler, HttpWebhookHandler],
    },
    JobHandlerFactory,
    QueueProducer,
    QueueProcessor,
    QueueDispatcherService,
  ],
  exports: [QueueProducer, JobHandlerFactory, BullModule],
})
export class QueueModule {}
