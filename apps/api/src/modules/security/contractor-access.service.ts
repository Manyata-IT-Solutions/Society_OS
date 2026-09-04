import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateContractorAuthorizationDto } from '@community-os/contracts';

@Injectable()
export class ContractorAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async createAuthorization(dto: CreateContractorAuthorizationDto) {
    return this.prisma.contractorAccessAuthorization.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        vendorId: dto.vendorId,
        projectId: dto.projectId,
        workOrderId: dto.workOrderId,
        title: dto.title,
        authorizedFrom: new Date(dto.authorizedFrom),
        authorizedUntil: new Date(dto.authorizedUntil),
        allowedGates: dto.allowedGates || '*',
        workerLimit: dto.workerLimit || 10,
        timeWindows: dto.timeWindows || '08:00-19:00',
        status: 'ACTIVE',
        workers: dto.workers
          ? {
              create: dto.workers.map((w) => ({
                vendorId: dto.vendorId,
                workerReference: w.workerReference,
                name: w.name,
                phone: w.phone,
                skillTrade: w.skillTrade,
                status: 'ACTIVE',
              })),
            }
          : undefined,
      },
      include: { workers: true, vendor: true, project: true },
    });
  }

  async getAuthorizations(communityId: string) {
    return this.prisma.contractorAccessAuthorization.findMany({
      where: { communityId },
      include: { workers: true, vendor: true, project: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
