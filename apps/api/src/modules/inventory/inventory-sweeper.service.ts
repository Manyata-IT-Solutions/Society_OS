import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class InventorySweeperService {
  private readonly logger = new Logger(InventorySweeperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async sweepExpiringBatches() {
    this.logger.log('Sweeping expiring batches...');
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);

    const expiring = await this.prisma.inventoryBatch.findMany({
      where: {
        expiryAt: { lte: threshold, gt: new Date() },
        status: 'ACTIVE',
      },
      include: { item: true },
    });

    for (const b of expiring) {
      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.INVENTORY_BATCH_EXPIRING, {
          batchId: b.id,
          itemId: b.itemId,
          batchNumber: b.batchNumber,
          expiryAt: b.expiryAt?.toISOString(),
        }),
      );
    }
  }
}
