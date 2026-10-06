import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateHouseholdServiceAccessDto } from '@community-os/contracts';

@Injectable()
export class HouseholdServiceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async createServiceAccess(dto: CreateHouseholdServiceAccessDto) {
    return this.prisma.householdServiceAccess.create({
      data: {
        communityId: dto.communityId,
        householdId: dto.householdId,
        unitId: dto.unitId,
        servicePersonName: dto.servicePersonName,
        phone: dto.phone,
        serviceType: dto.serviceType,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        allowedDays: dto.allowedDays || 'MON,TUE,WED,THU,FRI,SAT,SUN',
        allowedTimeStart: dto.allowedTimeStart || '06:00',
        allowedTimeEnd: dto.allowedTimeEnd || '21:00',
        status: 'ACTIVE',
      },
    });
  }

  async getServiceAccesses(communityId: string) {
    return this.prisma.householdServiceAccess.findMany({
      where: { communityId },
      include: { unit: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
