import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { RuleModule } from '../rule/rule.module.js';
import { ApprovalModule } from '../approval/approval.module.js';
import { SlaModule } from '../sla/sla.module.js';
import { WorkflowRegistry } from './workflow-registry.js';
import { WorkflowValidator } from './workflow-validator.js';
import { WorkflowDefinitionRepository } from './workflow-definition.repository.js';
import { WorkflowInstanceRepository } from './workflow-instance.repository.js';
import { WorkflowService } from './workflow.service.js';
import { WorkflowController } from './workflow.controller.js';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    AuthModule,
    AuthorizationModule,
    RuleModule,
    ApprovalModule,
    SlaModule,
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowRegistry,
    WorkflowValidator,
    WorkflowDefinitionRepository,
    WorkflowInstanceRepository,
    WorkflowService,
  ],
  exports: [
    WorkflowRegistry,
    WorkflowValidator,
    WorkflowDefinitionRepository,
    WorkflowInstanceRepository,
    WorkflowService,
  ],
})
export class WorkflowModule {}
