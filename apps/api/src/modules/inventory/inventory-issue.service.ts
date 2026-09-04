import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryIssueRepository } from './inventory-issue.repository.js';
import { InventorySequenceService } from './inventory-sequence.service.js';
import { StockLedgerService } from './stock-ledger.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, InventoryIssue } from '@community-os/types';

@Injectable()
export class InventoryIssueService {
  constructor(
    private readonly issueRepo: InventoryIssueRepository,
    private readonly sequenceService: InventorySequenceService,
    private readonly stockLedgerService: StockLedgerService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createIssue(
    data: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      issueType?: any;
      workOrderId?: string | null;
      issuedToUserId?: string | null;
      issuedToTeamId?: string | null;
      notes?: string | null;
      lines: Array<{
        itemId: string;
        requirementId?: string | null;
        requestedQty: number;
        issuedQty: number;
        uomId: string;
        batchId?: string | null;
        serialIds?: string[];
        binId?: string | null;
        notes?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<InventoryIssue> {
    return this.prisma.$transaction(async (tx) => {
      const issueNumber = await this.sequenceService.getNextNumber(
        data.organizationId,
        data.communityId ?? null,
        'ISSUE',
        'ISS',
      );

      const issue = await tx.inventoryIssue.create({
        data: {
          organization: { connect: { id: data.organizationId } },
          ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
          issueNumber,
          store: { connect: { id: data.storeId } },
          issueType: data.issueType ?? 'WORK_ORDER',
          ...(data.workOrderId ? { workOrder: { connect: { id: data.workOrderId } } } : {}),
          issuedToUserId: data.issuedToUserId ?? null,
          issuedToTeamId: data.issuedToTeamId ?? null,
          status: 'POSTED',
          issuedAt: new Date(),
          issuedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
          notes: data.notes ?? null,
          lines: {
            create: data.lines.map((l) => ({
              item: { connect: { id: l.itemId } },
              ...(l.requirementId ? { requirement: { connect: { id: l.requirementId } } } : {}),
              requestedQty: l.requestedQty,
              issuedQty: l.issuedQty,
              uom: { connect: { id: l.uomId } },
              ...(l.batchId ? { batch: { connect: { id: l.batchId } } } : {}),
              serialIds: l.serialIds ?? [],
              ...(l.binId ? { bin: { connect: { id: l.binId } } } : {}),
              notes: l.notes ?? null,
            })),
          },
        },
        include: {
          store: true,
          workOrder: true,
          issuedByUser: true,
          lines: {
            include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
          },
        },
      });

      for (const line of issue.lines) {
        let reservedDeduction = 0;
        if (line.requirementId) {
          const req = await tx.workOrderMaterialRequirement.findUnique({
            where: { id: line.requirementId },
          });
          if (req && Number(req.reservedQty) > 0) {
            reservedDeduction = Math.min(Number(req.reservedQty), Number(line.issuedQty));
            await tx.workOrderMaterialRequirement.update({
              where: { id: line.requirementId },
              data: {
                reservedQty: { decrement: reservedDeduction },
                issuedQty: { increment: Number(line.issuedQty) },
                status: 'ISSUED',
              },
            });
          } else if (req) {
            await tx.workOrderMaterialRequirement.update({
              where: { id: line.requirementId },
              data: {
                issuedQty: { increment: Number(line.issuedQty) },
                status: 'ISSUED',
              },
            });
          }
        }

        await this.stockLedgerService.recordMovement(
          {
            organizationId: data.organizationId,
            communityId: data.communityId,
            storeId: data.storeId,
            binId: line.binId,
            itemId: line.itemId,
            batchId: line.batchId,
            transactionType: 'ISSUE',
            quantityDelta: -Number(line.issuedQty),
            uom: line.uom.code,
            referenceType: data.workOrderId ? 'WORK_ORDER' : 'ISSUE',
            referenceId: data.workOrderId || issue.id,
            notes: `Material Issue ${issue.issueNumber}`,
            onHandDelta: -Number(line.issuedQty),
            reservedDelta: -reservedDeduction,
          },
          actor,
          tx,
        );

        if (Array.isArray(line.serialIds) && line.serialIds.length > 0) {
          for (const sId of line.serialIds as string[]) {
            await tx.inventorySerial.update({
              where: { id: sId },
              data: {
                status: 'ISSUED',
                currentWorkOrderId: data.workOrderId ?? null,
              },
            });
          }
        }
      }

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_STOCK_ISSUED,
          {
            issueId: issue.id,
            issueNumber: issue.issueNumber,
            storeId: issue.storeId,
            workOrderId: issue.workOrderId,
            issuedToUserId: issue.issuedToUserId,
            lineCount: issue.lines.length,
          },
          {
            organizationId: data.organizationId,
            communityId: data.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return issue as any;
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    workOrderId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }) {
    return this.issueRepo.findAll(params);
  }

  async findById(id: string): Promise<InventoryIssue> {
    const issue = await this.issueRepo.findById(id);
    if (!issue) {
      throw new NotFoundException(`Inventory issue '${id}' not found`);
    }
    return issue as any;
  }
}
