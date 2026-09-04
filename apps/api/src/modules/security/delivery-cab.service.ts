import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class DeliveryCabService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveries(communityId: string) {
    return this.prisma.visit.findMany({
      where: { communityId, visitType: 'DELIVERY' },
      include: { deliveryDetail: true, destinationUnit: true, visitor: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
