function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetCommitmentEntry, CommitmentSourceType } from '@prisma/client';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class BudgetCommitmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createReservation(params: {
    budgetLineId: string;
    sourceType: CommitmentSourceType;
    sourceId: string;
    amount: number;
    reference?: string;
    notes?: string;
    actor?: any;
  }): Promise<BudgetCommitmentEntry> {
    const userId = params.actor?.userId || params.actor?.id;
    const entry = await this.prisma.budgetCommitmentEntry.create({
      data: {
        budgetLine: { connect: { id: params.budgetLineId } },
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        entryType: 'RESERVATION',
        amount: params.amount,
        entryDate: new Date(),
        status: 'ACTIVE',
        reference: params.reference,
        notes: params.notes,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_RESERVATION_CREATED ?? 'budget.reservation_created.v1',
        { budgetLineId: params.budgetLineId, sourceId: params.sourceId, amount: params.amount },
        { userId },
      ),
    );

    return entry;
  }

  async releaseReservation(sourceId: string, _actor?: any): Promise<void> {
    await this.prisma.budgetCommitmentEntry.updateMany({
      where: {
        sourceId,
        entryType: 'RESERVATION',
        status: 'ACTIVE',
      },
      data: { status: 'RELEASED' },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_RESERVATION_RELEASED ?? 'budget.reservation_released.v1',
        { sourceId },
      ),
    );
  }

  // Convert PR reservation to PO commitment without double counting
  async convertReservationToCommitment(params: {
    budgetLineId: string;
    reservationSourceId: string;
    poId: string;
    poAmount: number;
    reference?: string;
    actor?: any;
  }): Promise<BudgetCommitmentEntry> {
    const userId = params.actor?.userId || params.actor?.id;

    // 1. Release active reservation
    await this.prisma.budgetCommitmentEntry.updateMany({
      where: {
        sourceId: params.reservationSourceId,
        entryType: 'RESERVATION',
        status: 'ACTIVE',
      },
      data: { status: 'CONSUMED' },
    });

    // 2. Create PO Commitment
    const entry = await this.prisma.budgetCommitmentEntry.create({
      data: {
        budgetLine: { connect: { id: params.budgetLineId } },
        sourceType: 'PURCHASE_ORDER',
        sourceId: params.poId,
        entryType: 'COMMITMENT',
        amount: params.poAmount,
        entryDate: new Date(),
        status: 'ACTIVE',
        reference: params.reference,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_COMMITMENT_CREATED ?? 'budget.commitment_created.v1',
        { budgetLineId: params.budgetLineId, poId: params.poId, amount: params.poAmount },
        { userId },
      ),
    );

    return entry;
  }

  // Adjust PO Commitment (e.g. PO revision)
  async adjustCommitment(params: {
    poId: string;
    newAmount: number;
    reference?: string;
    actor?: any;
  }): Promise<BudgetCommitmentEntry> {
    const existing = await this.prisma.budgetCommitmentEntry.findFirst({
      where: { sourceId: params.poId, entryType: 'COMMITMENT', status: 'ACTIVE' },
    });
    if (!existing) throw new NotFoundException('Active PO commitment not found');

    const diff = params.newAmount - Number(existing.amount);
    const userId = params.actor?.userId || params.actor?.id;

    // Update existing or record adjustment
    await this.prisma.budgetCommitmentEntry.update({
      where: { id: existing.id },
      data: { amount: params.newAmount },
    });

    const adj = await this.prisma.budgetCommitmentEntry.create({
      data: {
        budgetLineId: existing.budgetLineId,
        sourceType: 'PURCHASE_ORDER',
        sourceId: params.poId,
        entryType: 'COMMITMENT_ADJUSTMENT',
        amount: diff,
        entryDate: new Date(),
        status: 'ACTIVE',
        reference: params.reference || `Revision for PO ${params.poId.slice(0, 8)}`,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    return adj;
  }

  // Consume commitment when Supplier Invoice is posted
  async consumeCommitment(params: {
    poId: string;
    invoiceAmount: number;
    _actor?: any;
  }): Promise<void> {
    const existing = await this.prisma.budgetCommitmentEntry.findFirst({
      where: { sourceId: params.poId, entryType: 'COMMITMENT', status: 'ACTIVE' },
    });
    if (!existing) return;

    const remaining = Number(existing.amount) - params.invoiceAmount;
    if (remaining <= 0) {
      await this.prisma.budgetCommitmentEntry.update({
        where: { id: existing.id },
        data: { status: 'CONSUMED', amount: 0 },
      });
    } else {
      await this.prisma.budgetCommitmentEntry.update({
        where: { id: existing.id },
        data: { amount: remaining },
      });
    }
  }

  async listCommitments(budgetLineId: string): Promise<BudgetCommitmentEntry[]> {
    return this.prisma.budgetCommitmentEntry.findMany({
      where: { budgetLineId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
