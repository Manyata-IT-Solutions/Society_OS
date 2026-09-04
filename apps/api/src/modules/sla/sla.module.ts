import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { BusinessCalendarRepository } from './business-calendar.repository.js';
import { BusinessCalendarService } from './business-calendar.service.js';
import { SlaPolicyRepository } from './sla-policy.repository.js';
import { SlaInstanceRepository } from './sla-instance.repository.js';
import { SlaService } from './sla.service.js';
import { SlaSweeperService } from './sla-sweeper.service.js';
import { SlaController } from './sla.controller.js';
import { BusinessCalendarsController } from './business-calendars.controller.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuthModule, AuthorizationModule],
  controllers: [SlaController, BusinessCalendarsController],
  providers: [
    BusinessCalendarRepository,
    BusinessCalendarService,
    SlaPolicyRepository,
    SlaInstanceRepository,
    SlaService,
    SlaSweeperService,
  ],
  exports: [
    BusinessCalendarRepository,
    BusinessCalendarService,
    SlaPolicyRepository,
    SlaInstanceRepository,
    SlaService,
    SlaSweeperService,
  ],
})
export class SlaModule {}
