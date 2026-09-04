import { Module, OnModuleInit } from '@nestjs/common';
import { TicketSequenceService } from './ticket-sequence.service.js';
import { TicketCategoryRepository } from './ticket-category.repository.js';
import { TicketCategoryService } from './ticket-category.service.js';
import { TicketCategoryController } from './ticket-category.controller.js';
import { HelpdeskTeamRepository } from './helpdesk-team.repository.js';
import { HelpdeskTeamService } from './helpdesk-team.service.js';
import { HelpdeskTeamController } from './helpdesk-team.controller.js';
import { TicketRepository } from './ticket.repository.js';
import { TicketService } from './ticket.service.js';
import { TicketController, ResidentComplaintController } from './ticket.controller.js';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { SlaModule } from '../sla/sla.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { CustomFieldModule } from '../custom-field/custom-field.module.js';
import { EventsModule } from '../events/events.module.js';
import { FactRegistry } from '../rule/fact-registry.js';
import { RuleModule } from '../rule/rule.module.js';

@Module({
  imports: [
    WorkflowModule,
    SlaModule,
    AuditModule,
    NotificationModule,
    CustomFieldModule,
    EventsModule,
    RuleModule,
  ],
  controllers: [
    TicketCategoryController,
    HelpdeskTeamController,
    TicketController,
    ResidentComplaintController,
  ],
  providers: [
    TicketSequenceService,
    TicketCategoryRepository,
    TicketCategoryService,
    HelpdeskTeamRepository,
    HelpdeskTeamService,
    TicketRepository,
    TicketService,
  ],
  exports: [
    TicketService,
    TicketCategoryService,
    HelpdeskTeamService,
    TicketRepository,
    TicketCategoryRepository,
    HelpdeskTeamRepository,
  ],
})
export class HelpdeskModule implements OnModuleInit {
  constructor(private readonly factRegistry: FactRegistry) {}

  onModuleInit(): void {
    // Register Phase 8 Ticket Domain Facts for Workflow & Rules Engine
    this.factRegistry.registerFact({
      path: 'ticket.priority',
      type: 'STRING',
      description: 'Priority of ticket (LOW, NORMAL, HIGH, URGENT, CRITICAL)',
      resourceTypes: ['TICKET', '*'],
    });

    this.factRegistry.registerFact({
      path: 'ticket.categoryKey',
      type: 'STRING',
      description: 'Key of ticket category',
      resourceTypes: ['TICKET', '*'],
    });

    this.factRegistry.registerFact({
      path: 'ticket.locationType',
      type: 'STRING',
      description: 'Location type (UNIT, FLOOR, BUILDING, SECTION, COMMON_AREA, COMMUNITY)',
      resourceTypes: ['TICKET', '*'],
    });

    this.factRegistry.registerFact({
      path: 'ticket.reopenCount',
      type: 'NUMBER',
      description: 'Number of times ticket was reopened',
      resourceTypes: ['TICKET', '*'],
    });

    this.factRegistry.registerFact({
      path: 'ticket.isSensitive',
      type: 'BOOLEAN',
      description: 'Whether category is marked as confidential/sensitive',
      resourceTypes: ['TICKET', '*'],
    });

    this.factRegistry.registerFact({
      path: 'ticket.hasAssignedTeam',
      type: 'BOOLEAN',
      description: 'Whether ticket is assigned to a helpdesk operational team',
      resourceTypes: ['TICKET', '*'],
    });

    this.factRegistry.registerFact({
      path: 'ticket.hasAssignedUser',
      type: 'BOOLEAN',
      description: 'Whether ticket is assigned to an individual technician',
      resourceTypes: ['TICKET', '*'],
    });
  }
}
