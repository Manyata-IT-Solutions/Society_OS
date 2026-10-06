import { TicketService } from './ticket.service.js';
import type { TicketRepository } from './ticket.repository.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { LoggerService } from '../logger/logger.service.js';
import type { WorkflowService } from '../workflow/workflow.service.js';
import type { TicketSequenceService } from './ticket-sequence.service.js';
import type { TicketCategoryRepository } from './ticket-category.repository.js';
import type { HelpdeskTeamRepository } from './helpdesk-team.repository.js';
import type { SlaService } from '../sla/sla.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { NotificationService } from '../notification/notification.service.js';
import type { CustomFieldService } from '../custom-field/custom-field.service.js';
import type { EventsService } from '../events/events.service.js';
import type { Actor } from '@community-os/types';

describe('Ticket Privacy & Security Authorization Unit Tests', () => {
  let service: TicketService;
  let mockPrisma: {
    resident: { findFirst: jest.Mock; findMany: jest.Mock };
    householdMember: { findMany: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let mockTicketRepo: {
    findTicketById: jest.Mock;
    findComments: jest.Mock;
    findFeedbackByTicketId: jest.Mock;
    findRelationsByTicketId: jest.Mock;
  };

  const residentActor: Actor = {
    id: 'resident-user-1',
    email: 'resident@community.os',
    displayName: 'Resident User',
    isPlatformAdmin: false,
    sessionId: 'session-res-1',
  };

  beforeEach(() => {
    mockPrisma = {
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
    };

    mockTicketRepo = {
      findTicketById: jest.fn(),
      findComments: jest.fn(),
      findFeedbackByTicketId: jest.fn(),
      findRelationsByTicketId: jest.fn(),
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
      {} as unknown as TicketSequenceService,
      {} as unknown as TicketCategoryRepository,
      {} as unknown as HelpdeskTeamRepository,
      { getAllowedActions: jest.fn().mockResolvedValue([]) } as unknown as WorkflowService,
      {} as unknown as SlaService,
      {} as unknown as AuditService,
      {} as unknown as NotificationService,
      {} as unknown as CustomFieldService,
      {} as unknown as EventsService,
      mockLogger as unknown as LoggerService,
    );
  });

  it('should strip INTERNAL_NOTE comments when accessed by a resident user', async () => {
    // Setup resident check
    mockPrisma.resident.findFirst.mockResolvedValue({
      id: 'res-1',
      userId: 'resident-user-1',
      householdMembers: [{ household: { unitId: 'unit-1' } }],
      ownerships: [],
    });

    mockTicketRepo.findTicketById.mockResolvedValue({
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-00001',
      unitId: 'unit-1',
      reportedByUserId: 'resident-user-1',
      category: { isSensitive: false },
    });

    mockTicketRepo.findComments.mockImplementation((id: string, includeInternal: boolean) => {
      const all = [
        { id: 'c-1', type: 'PUBLIC_REPLY', body: 'Technician is on the way.' },
        { id: 'c-2', type: 'INTERNAL_NOTE', body: 'Resident was angry, send senior tech.' },
      ];
      return Promise.resolve(includeInternal ? all : all.filter((c) => c.type === 'PUBLIC_REPLY'));
    });

    const comments = await service.getComments('ticket-1', residentActor);

    expect(comments.length).toBe(1);
    expect(comments[0]!.type).toBe('PUBLIC_REPLY');
    expect(comments.some((c) => c.type === 'INTERNAL_NOTE')).toBe(false);
  });

  it('should forbid resident from viewing tickets outside their authorized units or reports', async () => {
    mockPrisma.resident.findFirst.mockResolvedValue({
      id: 'res-1',
      userId: 'resident-user-1',
      householdMembers: [{ household: { unitId: 'unit-1' } }],
      ownerships: [],
    });

    mockTicketRepo.findTicketById.mockResolvedValue({
      id: 'ticket-2',
      ticketNumber: 'TKT-2026-00002',
      unitId: 'unit-99', // Different unit
      reportedByUserId: 'other-user', // Different reporter
      category: { isSensitive: false },
    });

    await expect(service.getTicketById('ticket-2', residentActor)).rejects.toThrow(
      'You are not authorized to access this ticket.',
    );
  });
});
