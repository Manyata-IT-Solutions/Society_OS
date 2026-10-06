import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import type { Organization } from '@community-os/types';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  ChangeOrganizationStatusInput,
  OrganizationQueryParams,
} from '@community-os/validation';
import {
  OrganizationNotFoundException,
  DuplicateOrganizationSlugException,
  InvalidStatusTransitionException,
} from '../../common/exceptions/domain.exceptions.js';
import { isValidStatusTransition } from '../../common/domain/status-machine.js';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly repository: OrganizationRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const existing = await this.repository.findBySlug(input.slug);
    if (existing) {
      throw new DuplicateOrganizationSlugException(input.slug);
    }

    const org = await this.repository.create(input);

    this.logger.log(`Created organization: ${org.name} (${org.id})`, 'OrganizationService');

    // Emit domain event
    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.ORGANIZATION_CREATED,
        {
          organizationId: org.id,
          name: org.name,
          slug: org.slug,
          defaultCurrency: org.defaultCurrency,
          defaultTimezone: org.defaultTimezone,
        },
        { organizationId: org.id },
      ),
    );

    return org;
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.repository.findById(id);
    if (!org) {
      throw new OrganizationNotFoundException(id);
    }
    return org;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.repository.findBySlug(slug);
    if (!org) {
      throw new OrganizationNotFoundException(slug);
    }
    return org;
  }

  async findMany(params: OrganizationQueryParams): Promise<{
    items: Organization[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = params;
    const { items, total } = await this.repository.findMany(params);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const current = await this.findById(id);

    if (current.status === 'ARCHIVED') {
      throw new InvalidStatusTransitionException('ARCHIVED', 'MUTATION');
    }

    const updated = await this.repository.update(id, input, input.expectedVersion);

    this.logger.log(`Updated organization: ${updated.name} (${updated.id})`, 'OrganizationService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.ORGANIZATION_UPDATED,
        {
          organizationId: updated.id,
          name: input.name,
          legalName: input.legalName,
          defaultCurrency: input.defaultCurrency,
          defaultTimezone: input.defaultTimezone,
          version: updated.version,
        },
        { organizationId: updated.id },
      ),
    );

    return updated;
  }

  async changeStatus(id: string, input: ChangeOrganizationStatusInput): Promise<Organization> {
    const current = await this.findById(id);

    if (current.status === input.status) {
      return current;
    }

    if (!isValidStatusTransition(current.status, input.status)) {
      throw new InvalidStatusTransitionException(current.status, input.status);
    }

    const updated = await this.repository.updateStatus(id, input.status, input.expectedVersion);

    this.logger.log(
      `Changed status for organization ${updated.id}: ${current.status} -> ${updated.status}`,
      'OrganizationService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.ORGANIZATION_STATUS_CHANGED,
        {
          organizationId: updated.id,
          previousStatus: current.status,
          newStatus: updated.status,
          version: updated.version,
        },
        { organizationId: updated.id },
      ),
    );

    return updated;
  }
}
