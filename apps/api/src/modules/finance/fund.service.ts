import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FundRepository } from './fund.repository.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor } from '@community-os/types';

@Injectable()
export class FundService {
  constructor(
    private readonly fundRepo: FundRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createFund(data: any, actor: Actor) {
    const existing = await this.fundRepo.findByCode(data.accountingEntityId, data.code);
    if (existing) {
      throw new ConflictException(`Fund with code ${data.code} already exists`);
    }

    const fund = await this.fundRepo.create({
      accountingEntity: { connect: { id: data.accountingEntityId } },
      code: data.code,
      name: data.name,
      description: data.description,
      fundType: data.fundType || 'OPERATING',
      restrictionType: data.restrictionType || 'UNRESTRICTED',
      status: data.status || 'ACTIVE',
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_FUND_CREATED ?? 'finance.fund.created.v1',
        { code: fund.code, name: fund.name, fundType: fund.fundType },
        {
          organizationId: data.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return fund;
  }

  async getFund(id: string) {
    const fund = await this.fundRepo.findById(id);
    if (!fund) throw new NotFoundException('Fund not found');
    return fund;
  }

  async listFunds(accountingEntityId: string) {
    return this.fundRepo.findMany(accountingEntityId);
  }

  async updateFund(id: string, data: any) {
    await this.getFund(id);
    return this.fundRepo.update(id, data);
  }
}
