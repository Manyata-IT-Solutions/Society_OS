import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateSecurityGateDto } from '@community-os/contracts';

@Injectable()
export class SecurityGateService {
  constructor(private readonly prisma: PrismaService) {}

  async createGate(dto: CreateSecurityGateDto, userId?: string) {
    return this.prisma.securityGate.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        code: dto.code,
        name: dto.name,
        gateType: (dto.gateType as any) || 'MAIN',
        directionPolicy: (dto.directionPolicy as any) || 'ENTRY_AND_EXIT',
        locationDescription: dto.locationDescription,
        supportsVehicleEntry: dto.supportsVehicleEntry ?? true,
        supportsPedestrianEntry: dto.supportsPedestrianEntry ?? true,
        supportsDelivery: dto.supportsDelivery ?? true,
        supportsContractorEntry: dto.supportsContractorEntry ?? true,
        createdById: userId,
      },
      include: { posts: true, devices: true },
    });
  }

  async getGates(communityId: string) {
    return this.prisma.securityGate.findMany({
      where: { communityId },
      include: { posts: true, devices: true },
      orderBy: { code: 'asc' },
    });
  }

  async getGateById(id: string) {
    const gate = await this.prisma.securityGate.findUnique({
      where: { id },
      include: { posts: true, devices: true },
    });
    if (!gate) throw new NotFoundException(`Security Gate '${id}' not found.`);
    return gate;
  }
}
