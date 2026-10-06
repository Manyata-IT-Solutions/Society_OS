import { ResidentService } from './resident.service.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { ResidentRepository } from './resident.repository.js';
import type { EventsService } from '../events/events.service.js';
import type { LoggerService } from '../logger/logger.service.js';
import {
  DomainException,
  DuplicateEntityException,
} from '../../common/exceptions/domain.exceptions.js';

describe('ResidentService (Unit)', () => {
  let service: ResidentService;
  let mockPrisma: Record<string, unknown>;
  let mockResidentRepo: Record<string, unknown>;
  let mockEventsService: Record<string, unknown>;
  let mockLogger: Record<string, unknown>;

  const mockCommunity = {
    id: 'comm-1',
    organizationId: 'org-1',
    name: 'Green Meadows',
    status: 'ACTIVE',
  };

  const mockResident = {
    id: 'res-1',
    organizationId: 'org-1',
    communityId: 'comm-1',
    userId: null,
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    phone: '+12025550100',
    email: 'john.doe@example.com',
    status: 'ACTIVE',
    preferredLanguage: 'en',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      community: { findUnique: jest.fn() },
      user: { findUnique: jest.fn(), create: jest.fn() },
      tenantMembership: { upsert: jest.fn() },
      role: { findFirst: jest.fn() },
      roleAssignment: { findFirst: jest.fn(), create: jest.fn() },
    };

    mockResidentRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByUserId: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      linkUser: jest.fn(),
      archive: jest.fn(),
    };

    mockEventsService = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new ResidentService(
      mockPrisma as unknown as PrismaService,
      mockResidentRepo as unknown as ResidentRepository,
      mockEventsService as unknown as EventsService,
      mockLogger as unknown as LoggerService,
    );
  });

  describe('createResident', () => {
    it('should successfully create resident and publish domain event', async () => {
      (mockPrisma['community'] as { findUnique: jest.Mock }).findUnique.mockResolvedValue(
        mockCommunity,
      );
      (mockResidentRepo['findByEmail'] as jest.Mock).mockResolvedValue(null);
      (mockResidentRepo['findByPhone'] as jest.Mock).mockResolvedValue(null);
      (mockResidentRepo['create'] as jest.Mock).mockResolvedValue(mockResident);

      const result = await service.createResident('comm-1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+12025550100',
        status: 'ACTIVE',
        preferredLanguage: 'en',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('res-1');
      expect(mockResidentRepo['create']).toHaveBeenCalled();
      expect(mockEventsService['publish']).toHaveBeenCalled();
    });

    it('should prevent duplicate email within same community', async () => {
      (mockPrisma['community'] as { findUnique: jest.Mock }).findUnique.mockResolvedValue(
        mockCommunity,
      );
      (mockResidentRepo['findByEmail'] as jest.Mock).mockResolvedValue(mockResident);

      await expect(
        service.createResident('comm-1', {
          firstName: 'Johnny',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          status: 'ACTIVE',
          preferredLanguage: 'en',
        }),
      ).rejects.toThrow(DuplicateEntityException);
    });

    it('should throw if community does not exist', async () => {
      (mockPrisma['community'] as { findUnique: jest.Mock }).findUnique.mockResolvedValue(null);

      await expect(
        service.createResident('comm-non-existent', {
          firstName: 'John',
          lastName: 'Doe',
          status: 'ACTIVE',
          preferredLanguage: 'en',
        }),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('inviteResident', () => {
    it('should provision user account and assign RESIDENT role at COMMUNITY scope', async () => {
      (mockResidentRepo['findById'] as jest.Mock).mockResolvedValue(mockResident);
      (
        mockPrisma['user'] as { findUnique: jest.Mock; create: jest.Mock }
      ).findUnique.mockResolvedValue(null);
      (mockPrisma['user'] as { findUnique: jest.Mock; create: jest.Mock }).create.mockResolvedValue(
        {
          id: 'user-1',
          email: 'john.doe@example.com',
          displayName: 'John Doe',
          status: 'PENDING',
        },
      );
      (mockPrisma['tenantMembership'] as { upsert: jest.Mock }).upsert.mockResolvedValue({});
      (mockPrisma['role'] as { findFirst: jest.Mock }).findFirst.mockResolvedValue({
        id: 'role-resident',
        code: 'RESIDENT',
      });
      (
        mockPrisma['roleAssignment'] as { findFirst: jest.Mock; create: jest.Mock }
      ).findFirst.mockResolvedValue(null);
      (
        mockPrisma['roleAssignment'] as { findFirst: jest.Mock; create: jest.Mock }
      ).create.mockResolvedValue({});
      (mockResidentRepo['linkUser'] as jest.Mock).mockResolvedValue({
        ...mockResident,
        userId: 'user-1',
      });

      const result = await service.inviteResident('res-1');

      expect(result.user.id).toBe('user-1');
      expect(result.resident.userId).toBe('user-1');
      expect((mockPrisma['tenantMembership'] as { upsert: jest.Mock }).upsert).toHaveBeenCalled();
      expect((mockPrisma['roleAssignment'] as { create: jest.Mock }).create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          roleId: 'role-resident',
          scopeType: 'COMMUNITY',
          scopeId: 'comm-1',
          status: 'ACTIVE',
        },
      });
      expect(mockEventsService['publish']).toHaveBeenCalled();
    });
  });
});
