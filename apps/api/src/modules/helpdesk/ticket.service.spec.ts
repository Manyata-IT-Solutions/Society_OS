import { TicketService } from './ticket.service.js';
import type { TicketRepository } from './ticket.repository.js';
import type { TicketSequenceService } from './ticket-sequence.service.js';
import type { TicketCategoryRepository } from './ticket-category.repository.js';
import type { HelpdeskTeamRepository } from './helpdesk-team.repository.js';
import type { WorkflowService } from '../workflow/workflow.service.js';
import type { SlaService } from '../sla/sla.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { NotificationService } from '../notification/notification.service.js';
import type { EventsService } from '../events/events.service.js';
import type { CustomFieldService } from '../custom-field/custom-field.service.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { LoggerService } from '../logger/logger.service.js';
import type { Actor } from '@community-os/types';

describe('TicketService Unit Tests', () => {
  let service: TicketService;
  let mockPrisma: {
    ticketCategory: { findUnique: jest.Mock };
    slaPolicyDefinition: { findUnique: jest.Mock };
    unit: { findUnique: jest.Mock };
    resident: { findFirst: jest.Mock; findMany: jest.Mock };
    householdMember: { findMany: jest.Mock };
    user: { findUnique: jest.Mock };
    workflowInstance: { update: jest.Mock };
  };
  let mockTicketRepo: {
    createTicket: jest.Mock;
    findTicketById: jest.Mock;
    updateTicket: jest.Mock;
    createAssignmentHistory: jest.Mock;
    createComment: jest.Mock;
    findCommentsByTicketId: jest.Mock;
    createFeedback: jest.Mock;
    findFeedbackByTicketId: jest.Mock;
    createRelation: jest.Mock;
    findRelationsByTicketId: jest.Mock;
    findManyTickets: jest.Mock;
  };
  let mockSeqService: { getNextTicketNumber: jest.Mock };
  let mockWorkflowService: {
    startInstance: jest.Mock;
    transition: jest.Mock;
    getAllowedActions: jest.Mock;
  };
  let mockSlaService: { startSla: jest.Mock; completeSla: jest.Mock };
  let mockAuditService: { record: jest.Mock };
  let mockEventsService: { publish: jest.Mock };
  let mockCustomFieldService: { getDefinitions: jest.Mock; setEntityValues: jest.Mock };

  const mockActor: Actor = {
    id: 'user-operator-1',
    email: 'operator@community.os',
    displayName: 'Operator User',
    isPlatformAdmin: false,
    sessionId: 'session-1',
  };

  beforeEach(() => {
    mockPrisma = {
      ticketCategory: {
        findUnique: jest.fn(),
      },
      slaPolicyDefinition: {
        findUnique: jest.fn(),
      },
      unit: {
        findUnique: jest.fn(),
      },
      resident: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      householdMember: {
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      workflowInstance: {
        update: jest.fn().mockReturnValue(Promise.resolve({})),
      },
    };

    mockTicketRepo = {
      createTicket: jest.fn(),
      findTicketById: jest.fn(),
      updateTicket: jest.fn(),
      createAssignmentHistory: jest.fn(),
      createComment: jest.fn(),
      findCommentsByTicketId: jest.fn(),
      createFeedback: jest.fn(),
      findFeedbackByTicketId: jest.fn(),
      createRelation: jest.fn(),
      findRelationsByTicketId: jest.fn(),
      findManyTickets: jest.fn(),
    };

    mockSeqService = {
      getNextTicketNumber: jest.fn().mockReturnValue(Promise.resolve('TKT-2026-00001')),
    };

    mockWorkflowService = {
      startInstance: jest
        .fn()
        .mockReturnValue(Promise.resolve({ id: 'wf-inst-1', currentState: 'NEW' })),
      transition: jest
        .fn()
        .mockReturnValue(Promise.resolve({ id: 'wf-inst-1', currentState: 'ASSIGNED' })),
      getAllowedActions: jest
        .fn()
        .mockReturnValue(
          Promise.resolve([{ action: 'assign', label: 'Assign Ticket', targetState: 'ASSIGNED' }]),
        ),
    };

    mockSlaService = {
      startSla: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ id: 'sla-inst-1', dueAt: new Date(), warningAt: new Date() }),
        ),
      completeSla: jest.fn().mockReturnValue(Promise.resolve({})),
    };

    mockAuditService = {
      record: jest.fn().mockReturnValue(Promise.resolve({})),
    };

    mockEventsService = {
      publish: jest.fn(),
    };

    mockCustomFieldService = {
      getDefinitions: jest.fn().mockReturnValue(Promise.resolve([])),
      setEntityValues: jest.fn().mockReturnValue(Promise.resolve([])),
    };

    const mockCategoryRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'cat-1',
        name: 'Electrical',
        key: 'category.electrical',
        isActive: true,
        requiresUnit: false,
        defaultPriority: 'HIGH',
        defaultWorkflowKey: 'workflow.ticket.standard',
        defaultSlaPolicyId: 'sla-pol-1',
      }),
    };

    const mockTeamRepo = {
      findById: jest.fn(),
    };

    const mockNotificationService = {
      send: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new TicketService(
      mockPrisma as unknown as PrismaService,
      mockTicketRepo as unknown as TicketRepository,
      mockSeqService as unknown as TicketSequenceService,
      mockCategoryRepo as unknown as TicketCategoryRepository,
      mockTeamRepo as unknown as HelpdeskTeamRepository,
      mockWorkflowService as unknown as WorkflowService,
      mockSlaService as unknown as SlaService,
      mockAuditService as unknown as AuditService,
      mockNotificationService as unknown as NotificationService,
      mockCustomFieldService as unknown as CustomFieldService,
      mockEventsService as unknown as EventsService,
      mockLogger as unknown as LoggerService,
    );
  });

  it('should create a ticket with atomic sequence, workflow instance and SLA', async () => {
    mockPrisma.ticketCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Electrical',
      key: 'category.electrical',
      isActive: true,
      requiresUnit: false,
      defaultPriority: 'HIGH',
      defaultWorkflowKey: 'workflow.ticket.standard',
      defaultSlaPolicyId: 'sla-pol-1',
    });

    mockPrisma.slaPolicyDefinition.findUnique.mockResolvedValue({
      id: 'sla-pol-1',
      key: 'sla.ticket.resolution.standard',
      version: 1,
    });

    mockTicketRepo.createTicket.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-00001',
      title: 'Power outage in hallway',
      currentState: 'NEW',
      priority: 'HIGH',
      workflowInstanceId: 'wf-inst-1',
      slaInstanceId: 'sla-inst-1',
    });

    const result = await service.createTicket(
      {
        organizationId: 'org-1',
        communityId: 'comm-1',
        categoryId: 'cat-1',
        title: 'Power outage in hallway',
        description: 'Lights flickering and out in corridor B',
        locationType: 'BUILDING',
        priority: 'HIGH',
        source: 'ADMIN_WEB',
      },
      mockActor,
    );

    expect(result.ticketNumber).toBe('TKT-2026-00001');
    expect(mockWorkflowService.startInstance).toHaveBeenCalled();
    expect(mockSlaService.startSla).toHaveBeenCalled();
    expect(mockAuditService.record).toHaveBeenCalled();
    expect(mockEventsService.publish).toHaveBeenCalled();
  });

  it('should assign a ticket and record assignment history', async () => {
    mockTicketRepo.findTicketById.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-00001',
      currentState: 'NEW',
      workflowInstanceId: 'wf-inst-1',
      assignedTeamId: null,
      assignedUserId: null,
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    mockTicketRepo.updateTicket.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-00001',
      currentState: 'ASSIGNED',
      assignedTeamId: 'team-elec-1',
      assignedUserId: 'tech-1',
    });

    const result = await service.assignTicket(
      'ticket-1',
      { teamId: 'team-elec-1', userId: 'tech-1', reason: 'Dispatched to primary technician' },
      mockActor,
    );

    expect(result.assignedUserId).toBe('tech-1');
    expect(mockTicketRepo.createAssignmentHistory).toHaveBeenCalled();
    expect(mockWorkflowService.transition).toHaveBeenCalled();
    expect(mockAuditService.record).toHaveBeenCalled();
  });

  it('should prevent claim if ticket is already assigned to another technician', async () => {
    mockTicketRepo.findTicketById.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-00001',
      currentState: 'ASSIGNED',
      assignedUserId: 'tech-99', // already assigned to someone else
    });

    await expect(service.claimTicket('ticket-1', mockActor)).rejects.toThrow(
      'This ticket has already been assigned to another technician.',
    );
  });

  it('should resolve ticket, mark SLA completed and record resolution summary', async () => {
    mockTicketRepo.findTicketById.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-00001',
      currentState: 'IN_PROGRESS',
      workflowInstanceId: 'wf-inst-1',
      slaInstanceId: 'sla-inst-1',
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    mockWorkflowService.transition.mockResolvedValue({
      id: 'wf-inst-1',
      currentState: 'RESOLVED',
    });

    mockTicketRepo.updateTicket.mockResolvedValue({
      id: 'ticket-1',
      currentState: 'RESOLVED',
      resolutionCode: 'FIXED',
      resolutionSummary: 'Replaced faulty circuit breaker in panel B',
      slaStatus: 'COMPLETED',
    });

    const result = await service.resolveTicket(
      'ticket-1',
      { resolutionSummary: 'Replaced faulty circuit breaker in panel B', resolutionCode: 'FIXED' },
      mockActor,
    );

    expect(result.currentState).toBe('RESOLVED');
    expect(mockSlaService.completeSla).toHaveBeenCalledWith('sla-inst-1');
    expect(mockAuditService.record).toHaveBeenCalled();
  });

  it('should reopen ticket, increment reopen counter and post comment', async () => {
    mockTicketRepo.findTicketById.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-00001',
      currentState: 'RESOLVED',
      reopenCount: 0,
      workflowInstanceId: 'wf-inst-1',
    });

    mockWorkflowService.transition.mockResolvedValue({
      id: 'wf-inst-1',
      currentState: 'REOPENED',
    });

    mockTicketRepo.updateTicket.mockResolvedValue({
      id: 'ticket-1',
      currentState: 'REOPENED',
      reopenCount: 1,
    });

    const result = await service.reopenTicket(
      'ticket-1',
      { reason: 'Flickering started again after 2 hours' },
      mockActor,
    );

    expect(result.reopenCount).toBe(1);
    expect(mockTicketRepo.createComment).toHaveBeenCalled();
  });
});
