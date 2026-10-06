import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UtilitySequenceService } from './utility-sequence.service.js';
import { RecordWaterTankerDeliveryDto } from '@community-os/contracts';

@Injectable()
export class TankerOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: UtilitySequenceService,
  ) {}

  async recordDelivery(dto: RecordWaterTankerDeliveryDto) {
    const deliveryNumber = await this.sequence.getNextDeliveryNumber(dto.communityId);

    return this.prisma.waterTankerDelivery.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        deliveryNumber,
        vendorId: dto.vendorId,
        vehicleNumber: dto.vehicleNumber,
        deliveryAt: new Date(dto.deliveryAt),
        declaredQuantity: dto.declaredQuantity,
        verifiedQuantity: dto.verifiedQuantity || dto.declaredQuantity,
        uom: dto.uom,
        receivingLocation: dto.receivingLocation,
        receivedByWorkerId: dto.receivedByWorkerId,
        status: (dto.status as any) || 'ACCEPTED',
      },
    });
  }

  async listDeliveries(communityId: string) {
    return this.prisma.waterTankerDelivery.findMany({
      where: { communityId },
      include: { receivedByWorker: true },
      orderBy: { deliveryAt: 'desc' },
    });
  }
}
