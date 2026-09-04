import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrderService } from './work-order.service.js';
import { WorkOrderRepository } from './work-order.repository.js';
import { WorkOrderSequenceService } from './work-order-sequence.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RuleService } from '../rule/rule.service.js';
import { SlaService } from '../sla/sla.service.js';
import { PrismaService } from '../database/prisma.service.js';

import { FacilityCategoryRepository } from './facility-category.repository.js';
import { ChecklistTemplateRepository } from './checklist-template.repository.js';
import { WorkflowService } from '../workflow/workflow.service.js';
import { CustomFieldService } from '../custom-field/custom-field.service.js';

describe('WorkOrderService', () => {
  let service: WorkOrderService;

  const mockWorkOrderRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByWorkOrderNumber: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    createTask: jest.fn(),
    findActiveWorkLog: jest.fn(),
    createWorkLog: jest.fn(),
    stopWorkLog: jest.fn(),
    getKpiMetrics: jest.fn(),
  };

  const mockSequenceService = {
    nextWorkOrderNumber: jest.fn().mockResolvedValue('WO-2026-000001'),
  };

  const mockCategoryRepo = {
    findById: jest.fn(),
  };

  const mockChecklistRepo = {
    findById: jest.fn(),
  };

  const mockWorkflowService = {
    startWorkflow: jest.fn(),
    transition: jest.fn(),
  };

  const mockCustomFieldService = {
    validateAndStore: jest.fn(),
  };

  const mockEventsService = {
    publish: jest.fn(),
  };

  const mockAuditService = {
    record: jest.fn(),
  };

  const mockRuleService = {
    evaluateRules: jest.fn().mockResolvedValue([]),
  };

  const mockSlaService = {
    startSla: jest.fn().mockResolvedValue({ id: 'sla-1', targetResolutionTime: new Date() }),
  };

  const mockPrisma: any = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    slaPolicyDefinition: { findUnique: jest.fn().mockResolvedValue(null) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrderService,
        { provide: WorkOrderRepository, useValue: mockWorkOrderRepo },
        { provide: WorkOrderSequenceService, useValue: mockSequenceService },
        { provide: FacilityCategoryRepository, useValue: mockCategoryRepo },
        { provide: ChecklistTemplateRepository, useValue: mockChecklistRepo },
        { provide: WorkflowService, useValue: mockWorkflowService },
        { provide: CustomFieldService, useValue: mockCustomFieldService },
        { provide: EventsService, useValue: mockEventsService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: RuleService, useValue: mockRuleService },
        { provide: SlaService, useValue: mockSlaService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkOrderService>(WorkOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
