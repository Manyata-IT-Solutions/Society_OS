import { Test, TestingModule } from '@nestjs/testing';
import { MaintenancePlanService } from './maintenance-plan.service.js';
import { MaintenancePlanRepository } from './maintenance-plan.repository.js';
import { WorkOrderService } from './work-order.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../database/prisma.service.js';

describe('MaintenancePlanService', () => {
  let service: MaintenancePlanService;

  const mockPlanRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findMany: jest.fn(),
    findDuePlans: jest.fn(),
    update: jest.fn(),
    createOccurrence: jest.fn(),
    findOccurrence: jest.fn(),
    updateOccurrence: jest.fn(),
  };

  const mockWorkOrderService = {
    createWorkOrder: jest.fn(),
  };

  const mockEventsService = {
    publish: jest.fn(),
  };

  const mockAuditService = {
    record: jest.fn(),
  };

  const mockPrisma: any = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenancePlanService,
        { provide: MaintenancePlanRepository, useValue: mockPlanRepo },
        { provide: WorkOrderService, useValue: mockWorkOrderService },
        { provide: EventsService, useValue: mockEventsService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MaintenancePlanService>(MaintenancePlanService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
