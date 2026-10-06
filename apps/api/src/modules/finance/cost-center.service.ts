import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CostCenterRepository } from './cost-center.repository.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor } from '@community-os/types';

@Injectable()
export class CostCenterService {
  constructor(
    private readonly ccRepo: CostCenterRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createCostCenter(data: any, actor: Actor) {
    const existing = await this.ccRepo.findByCode(data.accountingEntityId, data.code);
    if (existing) {
      throw new ConflictException(`Cost Center with code ${data.code} already exists`);
    }

    const cc = await this.ccRepo.create({
      accountingEntity: { connect: { id: data.accountingEntityId } },
      code: data.code,
      name: data.name,
      description: data.description,
      parentCostCenter: data.parentCostCenterId
        ? { connect: { id: data.parentCostCenterId } }
        : undefined,
      status: data.status || 'ACTIVE',
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_COST_CENTER_CREATED ?? 'finance.cost_center.created.v1',
        { code: cc.code, name: cc.name },
        {
          organizationId: data.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return cc;
  }

  async getCostCenter(id: string) {
    const cc = await this.ccRepo.findById(id);
    if (!cc) throw new NotFoundException('Cost Center not found');
    return cc;
  }

  async listCostCenters(accountingEntityId: string) {
    return this.ccRepo.findMany(accountingEntityId);
  }

  async updateCostCenter(id: string, data: any) {
    await this.getCostCenter(id);
    return this.ccRepo.update(id, data);
  }
}
