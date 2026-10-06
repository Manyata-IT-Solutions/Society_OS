import { Module } from '@nestjs/common';
import { WorkOrderSequenceService } from './work-order-sequence.service.js';
import { FacilityCategoryRepository } from './facility-category.repository.js';
import { FacilityCategoryService } from './facility-category.service.js';
import { FacilityCategoryController } from './facility-category.controller.js';
import { ChecklistTemplateRepository } from './checklist-template.repository.js';
import { ChecklistTemplateService } from './checklist-template.service.js';
import { ChecklistTemplateController } from './checklist-template.controller.js';
import { WorkOrderRepository } from './work-order.repository.js';
import { WorkOrderService } from './work-order.service.js';
import { WorkOrderController, TicketWorkOrderController } from './work-order.controller.js';
import { MaintenancePlanRepository } from './maintenance-plan.repository.js';
import { MaintenancePlanService } from './maintenance-plan.service.js';
import { MaintenancePlanController } from './maintenance-plan.controller.js';
import { FacilitySchedulerService } from './facility-scheduler.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { SlaModule } from '../sla/sla.module.js';
import { CustomFieldModule } from '../custom-field/custom-field.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

@Module({
  imports: [
    DatabaseModule,
    WorkflowModule,
    SlaModule,
    CustomFieldModule,
    AuditModule,
    EventsModule,
    AuthorizationModule,
  ],
  controllers: [
    FacilityCategoryController,
    ChecklistTemplateController,
    WorkOrderController,
    TicketWorkOrderController,
    MaintenancePlanController,
  ],
  providers: [
    WorkOrderSequenceService,
    FacilityCategoryRepository,
    FacilityCategoryService,
    ChecklistTemplateRepository,
    ChecklistTemplateService,
    WorkOrderRepository,
    WorkOrderService,
    MaintenancePlanRepository,
    MaintenancePlanService,
    FacilitySchedulerService,
  ],
  exports: [
    WorkOrderService,
    MaintenancePlanService,
    FacilityCategoryService,
    ChecklistTemplateService,
  ],
})
export class FacilityModule {}
