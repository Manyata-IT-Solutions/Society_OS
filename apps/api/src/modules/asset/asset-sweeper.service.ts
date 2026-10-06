import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { createEvent, DOMAIN_EVENTS } from '@community-os/events';

@Injectable()
export class AssetSweeperService {
  private readonly logger = new Logger(AssetSweeperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async sweepExpiringWarranties(): Promise<number> {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const expiring = await this.prisma.assetWarranty.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: in30Days },
      },
      include: { asset: true },
    });

    for (const w of expiring) {
      const daysRemaining = Math.ceil(
        (w.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.prisma.assetWarranty.update({
        where: { id: w.id },
        data: { status: 'EXPIRING_SOON' },
      });

      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.ASSET_WARRANTY_EXPIRING, {
          warrantyId: w.id,
          assetId: w.assetId,
          assetCode: w.asset.assetCode,
          organizationId: w.asset.organizationId,
          communityId: w.asset.communityId,
          providerName: w.providerName,
          endDate: w.endDate.toISOString(),
          daysRemaining,
        }),
      );
    }

    // Expire past warranties
    await this.prisma.assetWarranty.updateMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        endDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    return expiring.length;
  }

  async sweepExpiringContracts(): Promise<number> {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const expiring = await this.prisma.assetServiceContract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: in30Days },
      },
    });

    for (const c of expiring) {
      const daysRemaining = Math.ceil(
        (c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.prisma.assetServiceContract.update({
        where: { id: c.id },
        data: { status: 'EXPIRING_SOON' },
      });

      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.ASSET_CONTRACT_EXPIRING, {
          contractId: c.id,
          contractNumber: c.contractNumber,
          organizationId: c.organizationId,
          communityId: c.communityId,
          serviceProviderName: c.serviceProviderName,
          endDate: c.endDate.toISOString(),
          daysRemaining,
        }),
      );
    }

    // Expire past contracts
    await this.prisma.assetServiceContract.updateMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        endDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    return expiring.length;
  }
}
