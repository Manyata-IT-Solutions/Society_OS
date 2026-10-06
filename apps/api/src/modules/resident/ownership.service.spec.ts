import { OwnershipService } from './ownership.service.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { OwnershipRepository } from './ownership.repository.js';
import type { ResidentRepository } from './resident.repository.js';
import type { EventsService } from '../events/events.service.js';
import type { LoggerService } from '../logger/logger.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

describe('OwnershipService (Unit)', () => {
  let service: OwnershipService;
  let mockPrisma: Record<string, unknown>;
  let mockOwnershipRepo: Record<string, unknown>;
  let mockResidentRepo: Record<string, unknown>;
  let mockEventsService: Record<string, unknown>;
  let mockLogger: Record<string, unknown>;

  const mockUnit = {
    id: 'unit-1',
    organizationId: 'org-1',
    communityId: 'comm-1',
    unitNumber: '101',
    status: 'ACTIVE',
  };

  const mockResident = {
    id: 'res-1',
    communityId: 'comm-1',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(() => {
    mockPrisma = {
      unit: { findUnique: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
        callback({
          unitOwnership: {
            update: jest.fn(),
            create: jest.fn().mockResolvedValue({
              id: 'new-own-1',
              unitId: 'unit-1',
              residentId: 'res-1',
              ownershipShare: 100.0,
              status: 'ACTIVE',
            }),
          },
        }),
      ),
    };

    mockOwnershipRepo = {
      findById: jest.fn(),
      findActiveByUnitId: jest.fn(),
      findByUnitId: jest.fn(),
      findByResidentId: jest.fn(),
      create: jest.fn(),
      endOwnership: jest.fn(),
    };

    mockResidentRepo = {
      findById: jest.fn(),
    };

    mockEventsService = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new OwnershipService(
      mockPrisma as unknown as PrismaService,
      mockOwnershipRepo as unknown as OwnershipRepository,
      mockResidentRepo as unknown as ResidentRepository,
      mockEventsService as unknown as EventsService,
      mockLogger as unknown as LoggerService,
    );
  });

  describe('createOwnership', () => {
    it('should create ownership when shares do not exceed 100%', async () => {
      (mockPrisma['unit'] as { findUnique: jest.Mock }).findUnique.mockResolvedValue(mockUnit);
      (mockResidentRepo['findById'] as jest.Mock).mockResolvedValue(mockResident);
      (mockOwnershipRepo['findActiveByUnitId'] as jest.Mock).mockResolvedValue([]);
      (mockOwnershipRepo['create'] as jest.Mock).mockResolvedValue({
        id: 'own-1',
        organizationId: 'org-1',
        communityId: 'comm-1',
        unitId: 'unit-1',
        residentId: 'res-1',
        ownershipShare: 50.0,
        ownershipType: 'JOINT',
        isPrimaryOwner: true,
        startDate: new Date(),
        status: 'ACTIVE',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createOwnership('unit-1', {
        unitId: 'unit-1',
        residentId: 'res-1',
        ownershipShare: 50.0,
        ownershipType: 'JOINT',
        isPrimaryOwner: true,
        startDate: '2026-09-01',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('own-1');
      expect(mockEventsService['publish']).toHaveBeenCalled();
    });

    it('should reject ownership if joint shares exceed 100%', async () => {
      (mockPrisma['unit'] as { findUnique: jest.Mock }).findUnique.mockResolvedValue(mockUnit);
      (mockResidentRepo['findById'] as jest.Mock).mockResolvedValue(mockResident);
      (mockOwnershipRepo['findActiveByUnitId'] as jest.Mock).mockResolvedValue([
        { id: 'existing-own', ownershipShare: 70.0 },
      ]);

      await expect(
        service.createOwnership('unit-1', {
          unitId: 'unit-1',
          residentId: 'res-1',
          ownershipShare: 40.0, // 70 + 40 = 110% > 100%
          ownershipType: 'JOINT',
          isPrimaryOwner: true,
          startDate: '2026-09-01',
        }),
      ).rejects.toThrow(DomainException);
    });
  });
});
