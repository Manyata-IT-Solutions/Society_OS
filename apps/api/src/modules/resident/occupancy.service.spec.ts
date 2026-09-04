import { OccupancyService } from './occupancy.service.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { OccupancyRepository } from './occupancy.repository.js';
import type { HouseholdRepository } from './household.repository.js';
import type { OwnershipRepository } from './ownership.repository.js';
import type { TenancyRepository } from './tenancy.repository.js';
import type { ResidentRepository } from './resident.repository.js';
import type { ResidentService } from './resident.service.js';
import type { EventsService } from '../events/events.service.js';
import type { LoggerService } from '../logger/logger.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

describe('OccupancyService (Unit)', () => {
  let service: OccupancyService;
  let mockPrisma: Record<string, unknown>;
  let mockOccupancyRepo: Record<string, unknown>;
  let mockHouseholdRepo: Record<string, unknown>;
  let mockOwnershipRepo: Record<string, unknown>;
  let mockTenancyRepo: Record<string, unknown>;
  let mockResidentRepo: Record<string, unknown>;
  let mockResidentService: Record<string, unknown>;
  let mockEventsService: Record<string, unknown>;
  let mockLogger: Record<string, unknown>;

  const mockUnit = {
    id: 'unit-1',
    organizationId: 'org-1',
    communityId: 'comm-1',
    unitNumber: '101',
    displayName: 'Unit 101',
    status: 'ACTIVE',
  };

  const mockResident = {
    id: 'res-1',
    organizationId: 'org-1',
    communityId: 'comm-1',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      unit: { findUnique: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
        callback({
          household: {
            create: jest.fn().mockResolvedValue({
              id: 'hh-1',
              organizationId: 'org-1',
              communityId: 'comm-1',
              unitId: 'unit-1',
              name: 'Doe Household',
              status: 'ACTIVE',
              startDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          householdMember: {
            create: jest.fn().mockResolvedValue({
              id: 'hm-1',
              householdId: 'hh-1',
              residentId: 'res-1',
              relationshipType: 'SELF',
              isPrimaryContact: true,
              status: 'ACTIVE',
              joinedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          unitOwnership: {
            create: jest.fn().mockResolvedValue({
              id: 'own-1',
              organizationId: 'org-1',
              communityId: 'comm-1',
              unitId: 'unit-1',
              residentId: 'res-1',
              ownershipType: 'SOLE',
              isPrimaryOwner: true,
              startDate: new Date(),
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          unitTenancy: {
            create: jest.fn(),
            update: jest.fn(),
            findFirst: jest.fn(),
          },
          unitOccupancy: {
            create: jest.fn().mockResolvedValue({
              id: 'occ-1',
              organizationId: 'org-1',
              communityId: 'comm-1',
              unitId: 'unit-1',
              householdId: 'hh-1',
              occupancyType: 'OWNER_OCCUPIED',
              startDate: new Date(),
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            update: jest.fn(),
          },
        }),
      ),
    };

    mockOccupancyRepo = {
      findById: jest.fn(),
      findActiveByUnitId: jest.fn(),
      findByUnitId: jest.fn(),
      findConflictingOccupancies: jest.fn(),
      create: jest.fn(),
      endOccupancy: jest.fn(),
    };

    mockHouseholdRepo = {
      findById: jest.fn(),
      findActiveByUnitId: jest.fn(),
      findByUnitId: jest.fn(),
    };

    mockOwnershipRepo = {
      findActiveByUnitId: jest.fn(),
      findByUnitId: jest.fn(),
    };

    mockTenancyRepo = {
      findActiveByUnitId: jest.fn(),
      findByUnitId: jest.fn(),
    };

    mockResidentRepo = {
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockResidentService = {
      inviteResident: jest.fn(),
    };

    mockEventsService = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new OccupancyService(
      mockPrisma as unknown as PrismaService,
      mockOccupancyRepo as unknown as OccupancyRepository,
      mockHouseholdRepo as unknown as HouseholdRepository,
      mockOwnershipRepo as unknown as OwnershipRepository,
      mockTenancyRepo as unknown as TenancyRepository,
      mockResidentRepo as unknown as ResidentRepository,
      mockResidentService as unknown as ResidentService,
      mockEventsService as unknown as EventsService,
      mockLogger as unknown as LoggerService,
    );
  });

  describe('moveIn', () => {
    it('should complete atomic move-in workflow for owner-occupied unit', async () => {
      (mockPrisma['unit'] as { findUnique: jest.Mock }).findUnique.mockResolvedValue(mockUnit);
      (mockOccupancyRepo['findConflictingOccupancies'] as jest.Mock).mockResolvedValue([]);
      (mockResidentRepo['findById'] as jest.Mock).mockResolvedValue(mockResident);

      const result = await service.moveIn('unit-1', {
        unitId: 'unit-1',
        occupancyType: 'OWNER_OCCUPIED',
        effectiveDate: '2026-09-01',
        householdName: 'Doe Household',
        primaryResident: {
          residentId: 'res-1',
          relationshipType: 'SELF',
        },
        additionalMembers: [],
        isNewOwner: true,
        sendAppInvitations: false,
      });

      expect(result).toBeDefined();
      expect(result.occupancy.occupancyType).toBe('OWNER_OCCUPIED');
      expect(result.primaryResident.id).toBe('res-1');
      expect(mockEventsService['publish']).toHaveBeenCalled();
    });

    it('should reject move-in if active occupancy date conflict exists', async () => {
      (mockPrisma['unit'] as { findUnique: jest.Mock }).findUnique.mockResolvedValue(mockUnit);
      (mockOccupancyRepo['findConflictingOccupancies'] as jest.Mock).mockResolvedValue([
        { id: 'existing-occ-1' },
      ]);

      await expect(
        service.moveIn('unit-1', {
          unitId: 'unit-1',
          occupancyType: 'OWNER_OCCUPIED',
          effectiveDate: '2026-09-01',
          primaryResident: {
            residentId: 'res-1',
            relationshipType: 'SELF',
          },
          additionalMembers: [],
          isNewOwner: false,
          sendAppInvitations: false,
        }),
      ).rejects.toThrow(DomainException);
    });
  });
});
