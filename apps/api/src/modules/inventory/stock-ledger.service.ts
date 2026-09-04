import { Injectable } from '@nestjs/common';
import { StockLedgerRepository } from './stock-ledger.repository.js';
import { StockBalanceService } from './stock-balance.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import type {
  Actor,
  StockLedgerEntry,
  StockTransactionType,
  StockReferenceType,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class StockLedgerService {
  constructor(
    private readonly ledgerRepo: StockLedgerRepository,
    private readonly balanceService: StockBalanceService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async recordMovement(
    params: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      binId?: string | null;
      itemId: string;
      batchId?: string | null;
      serialId?: string | null;
      transactionType: StockTransactionType;
      quantityDelta: number;
      uom: string;
      referenceType: StockReferenceType;
      referenceId?: string | null;
      idempotencyKey?: string | null;
      notes?: string | null;
      metadata?: Record<string, any> | null;
      onHandDelta: number;
      reservedDelta: number;
    },
    actor: Actor,
    tx?: Prisma.TransactionClient,
  ): Promise<StockLedgerEntry> {
    if (params.idempotencyKey) {
      const existing = await this.ledgerRepo.findByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        return existing as any;
      }
    }

    // 1. Apply delta to StockBalance read projection
    await this.balanceService.applyDelta(
      {
        organizationId: params.organizationId,
        communityId: params.communityId,
        storeId: params.storeId,
        binId: params.binId,
        itemId: params.itemId,
        batchId: params.batchId,
        onHandDelta: params.onHandDelta,
        reservedDelta: params.reservedDelta,
      },
      tx,
    );

    // 2. Append immutable StockLedgerEntry
    const entry = await this.ledgerRepo.createEntry(
      {
        organization: { connect: { id: params.organizationId } },
        ...(params.communityId ? { community: { connect: { id: params.communityId } } } : {}),
        store: { connect: { id: params.storeId } },
        ...(params.binId ? { bin: { connect: { id: params.binId } } } : {}),
        item: { connect: { id: params.itemId } },
        ...(params.batchId ? { batch: { connect: { id: params.batchId } } } : {}),
        ...(params.serialId ? { serial: { connect: { id: params.serialId } } } : {}),
        transactionType: params.transactionType as any,
        quantityDelta: params.quantityDelta,
        uom: params.uom,
        referenceType: params.referenceType as any,
        referenceId: params.referenceId ?? null,
        idempotencyKey: params.idempotencyKey ?? null,
        notes: params.notes ?? null,
        metadata: (params.metadata as any) ?? undefined,
        createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      },
      tx,
    );

    return entry as any;
  }

  async getLedger(params: any) {
    return this.getLedgerEntries(params);
  }

  async getLedgerEntries(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    itemId?: string;
    transactionType?: any;
    fromDate?: Date;
    toDate?: Date;
    skip?: number;
    take?: number;
  }) {
    return this.ledgerRepo.findLedgerEntries(params);
  }
}
