import { Injectable, BadRequestException } from '@nestjs/common';
import { StockReservationRepository } from './stock-reservation.repository.js';
import { StockBalanceService } from './stock-balance.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, StockReservation } from '@community-os/types';

@Injectable()
export class StockReservationService {
  constructor(
    private readonly reservationRepo: StockReservationRepository,
    private readonly balanceService: StockBalanceService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async reserveStock(
    params: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      itemId: string;
      workOrderId: string;
      requirementId?: string | null;
      batchId?: string | null;
      quantity: number;
      expiresAt?: Date | string | null;
    },
    actor: Actor,
  ): Promise<StockReservation> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check & increment quantityReserved
      let binId = (params as any).binId;
      if (!binId) {
        // If binId not provided, find any balance with available stock for this item in store
        const bal = await tx.stockBalance.findFirst({
          where: {
            storeId: params.storeId,
            itemId: params.itemId,
            quantityAvailable: { gte: params.quantity },
          },
        });
        if (bal) binId = bal.binId;
      }

      await this.balanceService.applyDelta(
        {
          organizationId: params.organizationId,
          communityId: params.communityId,
          storeId: params.storeId,
          binId: binId,
          itemId: params.itemId,
          batchId: params.batchId,
          onHandDelta: 0,
          reservedDelta: params.quantity,
        },
        tx,
      );

      // 2. Create StockReservation
      const reservation = await tx.stockReservation.create({
        data: {
          store: { connect: { id: params.storeId } },
          item: { connect: { id: params.itemId } },
          workOrder: { connect: { id: params.workOrderId } },
          ...(params.requirementId
            ? { requirement: { connect: { id: params.requirementId } } }
            : {}),
          ...(params.batchId ? { batch: { connect: { id: params.batchId } } } : {}),
          quantity: params.quantity,
          status: 'ACTIVE',
          expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
          createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
        },
        include: {
          store: true,
          item: true,
          workOrder: true,
          batch: true,
        },
      });

      // 3. Update WorkOrderMaterialRequirement reservedQty if linked
      if (params.requirementId) {
        await tx.workOrderMaterialRequirement.update({
          where: { id: params.requirementId },
          data: {
            reservedQty: { increment: params.quantity },
            status: 'RESERVED',
          },
        });
      }

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_RESERVATION_CREATED,
          {
            reservationId: reservation.id,
            storeId: reservation.storeId,
            itemId: reservation.itemId,
            workOrderId: reservation.workOrderId,
            quantity: Number(reservation.quantity),
          },
          {
            organizationId: params.organizationId,
            communityId: params.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return reservation as any;
    });
  }

  async releaseReservation(reservationId: string, actor: Actor): Promise<StockReservation> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (!reservation || reservation.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Reservation '${reservationId}' is not active or does not exist`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Release reserved stock on balance
      await this.balanceService.applyDelta(
        {
          organizationId: reservation.workOrder?.organizationId || '',
          storeId: reservation.storeId,
          itemId: reservation.itemId,
          batchId: reservation.batchId,
          onHandDelta: 0,
          reservedDelta: -Number(reservation.quantity),
        },
        tx,
      );

      // 2. Mark reservation RELEASED
      const updated = await tx.stockReservation.update({
        where: { id: reservationId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
        include: {
          store: true,
          item: true,
          workOrder: true,
          batch: true,
        },
      });

      // 3. Decrement WorkOrderMaterialRequirement if linked
      if (reservation.requirementId) {
        await tx.workOrderMaterialRequirement.update({
          where: { id: reservation.requirementId },
          data: {
            reservedQty: { decrement: Number(reservation.quantity) },
          },
        });
      }

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_RESERVATION_RELEASED,
          {
            reservationId: updated.id,
            storeId: updated.storeId,
            itemId: updated.itemId,
            workOrderId: updated.workOrderId,
            quantity: Number(updated.quantity),
          },
          { userId: actor?.id },
        ),
      );

      return updated as any;
    });
  }
}
