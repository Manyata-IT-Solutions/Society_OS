import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectSequenceService } from './project-sequence.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkPackageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ProjectSequenceService,
  ) {}

  async createWorkPackage(dto: any) {
    const packageNumber = await this.sequenceService.getNextPackageNumber(dto.projectId);

    return this.prisma.projectWorkPackage.create({
      data: {
        projectId: dto.projectId,
        packageNumber,
        name: dto.name,
        scope: dto.scope,
        status: 'DRAFT',
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        estimatedAmount: new Prisma.Decimal(dto.estimatedAmount || 0),
        budgetLineId: dto.budgetLineId,
        vendorId: dto.vendorId,
        purchaseOrderId: dto.purchaseOrderId,
        contractValue: new Prisma.Decimal(dto.contractValue || dto.estimatedAmount || 0),
        retentionPercent: new Prisma.Decimal(dto.retentionPercent || 5.0),
        mobilizationAdvanceAmount: new Prisma.Decimal(dto.mobilizationAdvanceAmount || 0),
      },
    });
  }

  async getWorkPackages(projectId: string) {
    return this.prisma.projectWorkPackage.findMany({
      where: { projectId },
      include: { vendor: true, purchaseOrder: true },
      orderBy: { packageNumber: 'asc' },
    });
  }

  async getWorkPackageById(id: string) {
    const wp = await this.prisma.projectWorkPackage.findUnique({
      where: { id },
      include: { vendor: true, purchaseOrder: true },
    });
    if (!wp) throw new NotFoundException('Work Package not found');
    return wp;
  }
}
