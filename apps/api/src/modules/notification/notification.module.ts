import { Module } from '@nestjs/common';
import { NotificationRepository } from './notification.repository.js';
import { NotificationTemplateRepository } from './notification-template.repository.js';
import { NotificationPreferenceRepository } from './notification-preference.repository.js';
import { TemplateEngineService } from './template-engine.service.js';
import { NotificationDeliveryService } from './notification-delivery.service.js';
import { NotificationService } from './notification.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationInboxController } from './notification-inbox.controller.js';
import { NotificationTemplatesController } from './notification-templates.controller.js';
import { NotificationPreferencesController } from './notification-preferences.controller.js';
import { LogSinkEmailProvider } from './providers/log-sink-email.provider.js';
import { LogSinkSmsProvider } from './providers/log-sink-sms.provider.js';
import { LogSinkPushProvider } from './providers/log-sink-push.provider.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, LoggerModule, AuthorizationModule],
  controllers: [
    NotificationsController,
    NotificationInboxController,
    NotificationTemplatesController,
    NotificationPreferencesController,
  ],
  providers: [
    NotificationRepository,
    NotificationTemplateRepository,
    NotificationPreferenceRepository,
    TemplateEngineService,
    NotificationDeliveryService,
    NotificationService,
    LogSinkEmailProvider,
    LogSinkSmsProvider,
    LogSinkPushProvider,
  ],
  exports: [
    NotificationRepository,
    NotificationTemplateRepository,
    NotificationPreferenceRepository,
    NotificationService,
    TemplateEngineService,
  ],
})
export class NotificationModule {}
