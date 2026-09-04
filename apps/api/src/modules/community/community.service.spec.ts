import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service.js';
import { CommunityRepository } from './community.repository.js';
import { OrganizationService } from '../organization/organization.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import {
  DuplicateCommunityCodeException,
  DuplicateCommunitySlugException,
  CommunityNotFoundException,
  InvalidStatusTransitionException,
} from '../../common/exceptions/domain.exceptions.js';
import type { Community, Organization, TenantContext } from '@community-os/types';

describe('CommunityService', () => {
  let service: CommunityService;
  let mockRepository: {
    findById: jest.Mock;
    findBySlug: jest.Mock;
    findByCode: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateStatus: jest.Mock;
  };
  let mockOrgService: {
    findById: jest.Mock;
  };
  let mockEventsService: {
    publish: jest.Mock;
    publishAll: jest.Mock;
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
  };

  const ctx: TenantContext = {
    organizationId: '123e4567-e89b-12d3-a456-426614174000',
    correlationId: 'test-corr-id',
    requestId: 'test-req-id',
  };

  const mockOrg: Organization = {
    id: ctx.organizationId!,
    name: 'Acme Property Management',
    slug: 'acme-property-mgmt',
    legalName: null,
    status: 'ACTIVE',
    defaultCurrency: 'USD',
    defaultTimezone: 'UTC',
    defaultLocale: 'en-US',
    settings: {},
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCommunity: Community = {
    id: '987e6543-e21b-12d3-a456-426614174999',
    organizationId: ctx.organizationId!,
    name: 'Sunset Valley Gated Society',
    code: 'SVG-01',
    slug: 'sunset-valley-gated-society',
    status: 'ACTIVE',
    timezone: 'UTC',
    locale: 'en-US',
    currency: 'USD',
    address: {
      addressLine1: '100 Sunset Blvd',
      city: 'Austin',
      postalCode: '78701',
      countryCode: 'US',
    },
    settings: {},
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByCode: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockOrgService = {
      findById: jest.fn().mockResolvedValue(mockOrg),
    };

    mockEventsService = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: CommunityRepository, useValue: mockRepository },
        { provide: OrganizationService, useValue: mockOrgService },
        { provide: EventsService, useValue: mockEventsService },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  it('should create a community and emit event', async () => {
    mockRepository.findBySlug.mockResolvedValue(null);
    mockRepository.findByCode.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(mockCommunity);

    const result = await service.create(ctx, {
      name: 'Sunset Valley Gated Society',
      code: 'SVG-01',
      slug: 'sunset-valley-gated-society',
      timezone: 'UTC',
      locale: 'en-US',
      currency: 'USD',
      address: {
        addressLine1: '100 Sunset Blvd',
        city: 'Austin',
        postalCode: '78701',
        countryCode: 'US',
      },
      settings: {},
    });

    expect(result).toEqual(mockCommunity);
    expect(mockEventsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          eventName: 'community.created.v1',
          organizationId: mockOrg.id,
          communityId: mockCommunity.id,
        }),
      }),
    );
  });

  it('should reject community creation if parent organization is ARCHIVED', async () => {
    mockOrgService.findById.mockResolvedValue({
      ...mockOrg,
      status: 'ARCHIVED',
    });

    await expect(
      service.create(ctx, {
        name: 'Sunset Valley',
        code: 'SVG-01',
        slug: 'sunset-valley',
        timezone: 'UTC',
        locale: 'en-US',
        currency: 'USD',
        address: {
          addressLine1: '100 Sunset Blvd',
          city: 'Austin',
          postalCode: '78701',
          countryCode: 'US',
        },
        settings: {},
      }),
    ).rejects.toThrow(InvalidStatusTransitionException);
  });

  it('should throw DuplicateCommunitySlugException on duplicate slug in same org', async () => {
    mockRepository.findBySlug.mockResolvedValue(mockCommunity);

    await expect(
      service.create(ctx, {
        name: 'Another Valley',
        code: 'DIFF-01',
        slug: 'sunset-valley-gated-society',
        timezone: 'UTC',
        locale: 'en-US',
        currency: 'USD',
        address: {
          addressLine1: '100 Sunset Blvd',
          city: 'Austin',
          postalCode: '78701',
          countryCode: 'US',
        },
        settings: {},
      }),
    ).rejects.toThrow(DuplicateCommunitySlugException);
  });

  it('should throw DuplicateCommunityCodeException on duplicate code in same org', async () => {
    mockRepository.findBySlug.mockResolvedValue(null);
    mockRepository.findByCode.mockResolvedValue(mockCommunity);

    await expect(
      service.create(ctx, {
        name: 'Another Valley',
        code: 'SVG-01',
        slug: 'unique-slug',
        timezone: 'UTC',
        locale: 'en-US',
        currency: 'USD',
        address: {
          addressLine1: '100 Sunset Blvd',
          city: 'Austin',
          postalCode: '78701',
          countryCode: 'US',
        },
        settings: {},
      }),
    ).rejects.toThrow(DuplicateCommunityCodeException);
  });

  it('should throw CommunityNotFoundException if community not found in tenant scope', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.findById(ctx, 'non-existent')).rejects.toThrow(CommunityNotFoundException);
  });
});
