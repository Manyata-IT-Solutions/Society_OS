import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service.js';
import { OrganizationRepository } from './organization.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import {
  DuplicateOrganizationSlugException,
  OrganizationNotFoundException,
  InvalidStatusTransitionException,
} from '../../common/exceptions/domain.exceptions.js';
import type { Organization } from '@community-os/types';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let mockRepository: {
    findById: jest.Mock;
    findBySlug: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateStatus: jest.Mock;
  };
  let mockEventsService: {
    publish: jest.Mock;
    publishAll: jest.Mock;
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
  };

  const mockOrg: Organization = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Acme Property Management',
    slug: 'acme-property-mgmt',
    legalName: 'Acme Property Management LLC',
    status: 'ACTIVE',
    defaultCurrency: 'USD',
    defaultTimezone: 'UTC',
    defaultLocale: 'en-US',
    settings: {},
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockEventsService = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: OrganizationRepository, useValue: mockRepository },
        { provide: EventsService, useValue: mockEventsService },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should create an organization and publish domain event', async () => {
    mockRepository.findBySlug.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(mockOrg);

    const result = await service.create({
      name: 'Acme Property Management',
      slug: 'acme-property-mgmt',
      defaultCurrency: 'USD',
      defaultTimezone: 'UTC',
      defaultLocale: 'en-US',
      settings: {},
    });

    expect(result).toEqual(mockOrg);
    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockEventsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          eventName: 'organization.created.v1',
          organizationId: mockOrg.id,
        }),
      }),
    );
  });

  it('should throw DuplicateOrganizationSlugException if slug already exists', async () => {
    mockRepository.findBySlug.mockResolvedValue(mockOrg);

    await expect(
      service.create({
        name: 'Another Name',
        slug: 'acme-property-mgmt',
        defaultCurrency: 'USD',
        defaultTimezone: 'UTC',
        defaultLocale: 'en-US',
        settings: {},
      }),
    ).rejects.toThrow(DuplicateOrganizationSlugException);
  });

  it('should throw OrganizationNotFoundException if not found by id', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.findById('non-existent-id')).rejects.toThrow(
      OrganizationNotFoundException,
    );
  });

  it('should transition status from ACTIVE to SUSPENDED', async () => {
    mockRepository.findById.mockResolvedValue(mockOrg);
    const updatedOrg = { ...mockOrg, status: 'SUSPENDED' as const, version: 2 };
    mockRepository.updateStatus.mockResolvedValue(updatedOrg);

    const result = await service.changeStatus(mockOrg.id, {
      status: 'SUSPENDED',
      expectedVersion: 1,
    });

    expect(result.status).toBe('SUSPENDED');
    expect(mockEventsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          eventName: 'organization.status_changed.v1',
        }),
      }),
    );
  });

  it('should reject transition from ARCHIVED to ACTIVE', async () => {
    const archivedOrg = { ...mockOrg, status: 'ARCHIVED' as const };
    mockRepository.findById.mockResolvedValue(archivedOrg);

    await expect(
      service.changeStatus(mockOrg.id, {
        status: 'ACTIVE',
      }),
    ).rejects.toThrow(InvalidStatusTransitionException);
  });
});
