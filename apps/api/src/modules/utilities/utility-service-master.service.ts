import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateUtilityServiceDto, CreateUtilitySupplySourceDto } from '@community-os/contracts';

@Injectable()
export class UtilityServiceMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async createService(dto: CreateUtilityServiceDto) {
    const existing = await this.prisma.utilityService.findUnique({
      where: {
        communityId_code: {
          communityId: dto.communityId,
          code: dto.code,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Utility service with code ${dto.code} already exists in this community`,
      );
    }

    return this.prisma.utilityService.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        code: dto.code,
        name: dto.name,
        utilityType: dto.utilityType as any,
        unitOfMeasure: dto.unitOfMeasure,
        billingEnabled: dto.billingEnabled !== false,
        timezone: dto.timezone || 'UTC',
      },
    });
  }

  async listServices(communityId: string) {
    return this.prisma.utilityService.findMany({
      where: { communityId },
      include: {
        sources: true,
        meters: true,
        tariffPlans: { where: { status: 'ACTIVE' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSupplySource(dto: CreateUtilitySupplySourceDto) {
    return this.prisma.utilitySupplySource.create({
      data: {
        utilityServiceId: dto.utilityServiceId,
        sourceType: dto.sourceType as any,
        code: dto.code,
        name: dto.name,
        assetId: dto.assetId,
        vendorId: dto.vendorId,
        capacity: dto.capacity,
        capacityUom: dto.capacityUom,
      },
    });
  }
}
