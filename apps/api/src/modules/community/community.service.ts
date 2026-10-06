import { Injectable } from '@nestjs/common';
import { CommunityRepository } from './community.repository.js';
import { OrganizationService } from '../organization/organization.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import type { Community, TenantContext } from '@community-os/types';
import type {
  CreateCommunityInput,
  UpdateCommunityInput,
  ChangeCommunityStatusInput,
  CommunityQueryParams,
} from '@community-os/validation';
import {
  CommunityNotFoundException,
  DuplicateCommunityCodeException,
  DuplicateCommunitySlugException,
  InvalidStatusTransitionException,
  TenantAccessDeniedException,
} from '../../common/exceptions/domain.exceptions.js';
import { isValidStatusTransition } from '../../common/domain/status-machine.js';

@Injectable()
export class CommunityService {
  constructor(
    private readonly repository: CommunityRepository,
    private readonly organizationService: OrganizationService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async create(ctx: TenantContext, input: CreateCommunityInput): Promise<Community> {
    const orgId = ctx.organizationId;
    if (!orgId) {
      throw new TenantAccessDeniedException(
        'Organization context is required to create a community.',
      );
    }

    // Verify parent organization exists and is operational
    const org = await this.organizationService.findById(orgId);
    if (org.status === 'ARCHIVED') {
      throw new InvalidStatusTransitionException('ARCHIVED_PARENT', 'CREATE_CHILD');
    }

    // Check unique slug within organization
    const existingSlug = await this.repository.findBySlug(ctx, input.slug);
    if (existingSlug) {
      throw new DuplicateCommunitySlugException(input.slug);
    }

    // Check unique code within organization
    const existingCode = await this.repository.findByCode(ctx, input.code);
    if (existingCode) {
      throw new DuplicateCommunityCodeException(input.code);
    }

    const community = await this.repository.create(ctx, input);

    this.logger.log(
      `Created community: ${community.name} (${community.id}) under org: ${org.name} (${org.id})`,
      'CommunityService',
    );

    // Emit domain event
    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.COMMUNITY_CREATED,
        {
          communityId: community.id,
          organizationId: community.organizationId,
          name: community.name,
          code: community.code,
          slug: community.slug,
          currency: community.currency,
          timezone: community.timezone,
          city: community.address.city,
          countryCode: community.address.countryCode,
        },
        { organizationId: community.organizationId, communityId: community.id },
      ),
    );

    return community;
  }

  async findById(ctx: TenantContext, id: string): Promise<Community> {
    const community = await this.repository.findById(ctx, id);
    if (!community) {
      throw new CommunityNotFoundException(id);
    }
    return community;
  }

  async findByIdUnscoped(id: string): Promise<Community> {
    const community = await this.repository.findByIdUnscoped(id);
    if (!community) {
      throw new CommunityNotFoundException(id);
    }
    return community;
  }

  async findMany(
    ctx: TenantContext,
    params: CommunityQueryParams,
  ): Promise<{
    items: Community[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = params;
    const { items, total } = await this.repository.findMany(ctx, params);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(ctx: TenantContext, id: string, input: UpdateCommunityInput): Promise<Community> {
    const current = await this.findById(ctx, id);

    if (current.status === 'ARCHIVED') {
      throw new InvalidStatusTransitionException('ARCHIVED', 'MUTATION');
    }

    const updated = await this.repository.update(ctx, id, input, input.expectedVersion);

    this.logger.log(
      `Updated community: ${updated.name} (${updated.id}) in org: ${updated.organizationId}`,
      'CommunityService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.COMMUNITY_UPDATED,
        {
          communityId: updated.id,
          organizationId: updated.organizationId,
          name: input.name,
          currency: input.currency,
          timezone: input.timezone,
          version: updated.version,
        },
        { organizationId: updated.organizationId, communityId: updated.id },
      ),
    );

    return updated;
  }

  async changeStatus(
    ctx: TenantContext,
    id: string,
    input: ChangeCommunityStatusInput,
  ): Promise<Community> {
    const current = await this.findById(ctx, id);

    if (current.status === input.status) {
      return current;
    }

    if (!isValidStatusTransition(current.status, input.status)) {
      throw new InvalidStatusTransitionException(current.status, input.status);
    }

    const updated = await this.repository.updateStatus(
      ctx,
      id,
      input.status,
      input.expectedVersion,
    );

    this.logger.log(
      `Changed status for community ${updated.id}: ${current.status} -> ${updated.status}`,
      'CommunityService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.COMMUNITY_STATUS_CHANGED,
        {
          communityId: updated.id,
          organizationId: updated.organizationId,
          previousStatus: current.status,
          newStatus: updated.status,
          version: updated.version,
        },
        { organizationId: updated.organizationId, communityId: updated.id },
      ),
    );

    return updated;
  }
}
