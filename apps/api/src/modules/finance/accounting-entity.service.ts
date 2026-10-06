import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AccountingEntityRepository } from './accounting-entity.repository.js';
import { FiscalCalendarRepository } from './fiscal-calendar.repository.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor } from '@community-os/types';

@Injectable()
export class AccountingEntityService {
  constructor(
    private readonly entityRepo: AccountingEntityRepository,
    private readonly fiscalRepo: FiscalCalendarRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createEntity(
    data: {
      organizationId: string;
      communityId?: string | null;
      code: string;
      name: string;
      legalName: string;
      countryCode?: string;
      baseCurrency?: string;
      timezone?: string;
    },
    actor: Actor,
  ) {
    const existing = await this.entityRepo.findByCode(data.organizationId, data.code);
    if (existing) {
      throw new ConflictException(`Accounting entity with code ${data.code} already exists`);
    }

    const entity = await this.entityRepo.create({
      organization: { connect: { id: data.organizationId } },
      community: data.communityId ? { connect: { id: data.communityId } } : undefined,
      code: data.code,
      name: data.name,
      legalName: data.legalName,
      countryCode: data.countryCode || 'IND',
      baseCurrency: data.baseCurrency || 'INR',
      timezone: data.timezone || 'Asia/Kolkata',
      status: 'ACTIVE',
    });

    await this.fiscalRepo.createCalendar({
      accountingEntity: { connect: { id: entity.id } },
      name: 'Default Statutory Calendar',
      fiscalStartMonth: 4,
      fiscalStartDay: 1,
      isDefault: true,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_ENTITY_CREATED ?? 'finance.entity.created.v1',
        { code: entity.code, name: entity.name, baseCurrency: entity.baseCurrency },
        {
          organizationId: data.organizationId,
          communityId: data.communityId ?? undefined,
          userId: actor?.id,
        },
      ),
    );

    return entity;
  }

  async getEntity(id: string) {
    const entity = await this.entityRepo.findById(id);
    if (!entity) throw new NotFoundException('Accounting entity not found');
    return entity;
  }

  async listEntities(organizationId: string, communityId?: string) {
    return this.entityRepo.findMany({ organizationId, communityId });
  }

  async updateEntity(id: string, data: any) {
    await this.getEntity(id);
    return this.entityRepo.update(id, data);
  }
}
