import { Injectable, HttpStatus } from '@nestjs/common';
import { PortfolioRepository } from './portfolio.repository.js';
import { OrganizationRepository } from '../organization/organization.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import {
  DomainException,
  DuplicateEntityException,
} from '../../common/exceptions/domain.exceptions.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import type {
  CreatePortfolioInput,
  UpdatePortfolioInput,
  PortfolioQueryParams,
} from '@community-os/validation';
import type { Portfolio, EntityStatus } from '@community-os/types';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepo: PortfolioRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async create(organizationId: string, input: CreatePortfolioInput): Promise<Portfolio> {
    const org = await this.orgRepo.findById(organizationId);
    if (!org) {
      throw new DomainException(
        'ORGANIZATION_NOT_FOUND',
        'Organization not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (org.status === 'ARCHIVED') {
      throw new DomainException(
        'ORGANIZATION_ARCHIVED',
        'Cannot create portfolio under an archived organization.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingCode = await this.portfolioRepo.findByCode(organizationId, input.code);
    if (existingCode) {
      throw new DuplicateEntityException('Portfolio code already exists in this organization.');
    }

    const portfolio = await this.portfolioRepo.create(organizationId, input);

    this.logger.log(
      `Created portfolio: ${portfolio.name} (${portfolio.id}) under org: ${organizationId}`,
      'PortfolioService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.PORTFOLIO_CREATED,
        {
          portfolioId: portfolio.id,
          organizationId: portfolio.organizationId,
          name: portfolio.name,
          code: portfolio.code,
        },
        { organizationId: portfolio.organizationId },
      ),
    );

    return portfolio;
  }

  async findById(id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepo.findById(id);
    if (!portfolio) {
      throw new DomainException(
        'PORTFOLIO_NOT_FOUND',
        'Portfolio not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    return portfolio;
  }

  async findMany(
    organizationId: string,
    params: PortfolioQueryParams,
  ): Promise<{ items: Portfolio[]; total: number }> {
    return this.portfolioRepo.findMany(organizationId, params);
  }

  async update(id: string, input: UpdatePortfolioInput): Promise<Portfolio> {
    await this.findById(id);

    const updated = await this.portfolioRepo.update(id, input);

    this.logger.log(`Updated portfolio: ${updated.name} (${updated.id})`, 'PortfolioService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.PORTFOLIO_UPDATED,
        {
          portfolioId: updated.id,
          organizationId: updated.organizationId,
          name: updated.name,
          status: updated.status,
          version: updated.version,
        },
        { organizationId: updated.organizationId },
      ),
    );

    return updated;
  }

  async archive(id: string, expectedVersion: number): Promise<Portfolio> {
    const portfolio = await this.findById(id);

    const updated = await this.portfolioRepo.changeStatus(
      id,
      'ARCHIVED' as EntityStatus,
      expectedVersion,
    );

    this.logger.log(`Archived portfolio: ${portfolio.name} (${id})`, 'PortfolioService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.PORTFOLIO_UPDATED,
        {
          portfolioId: updated.id,
          organizationId: updated.organizationId,
          status: 'ARCHIVED',
          version: updated.version,
        },
        { organizationId: updated.organizationId },
      ),
    );

    return updated;
  }
}
