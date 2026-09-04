import { Module } from '@nestjs/common';
import { AuditRepository } from './audit.repository.js';
import { AuditService } from './audit.service.js';
import { AuditEventSubscriberService } from './audit-event-subscriber.service.js';
import { AuditController } from './audit.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, LoggerModule, AuthorizationModule],
  controllers: [AuditController],
  providers: [AuditRepository, AuditService, AuditEventSubscriberService],
  exports: [AuditRepository, AuditService],
})
export class AuditModule {}
