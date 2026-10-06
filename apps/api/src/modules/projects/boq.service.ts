import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectSequenceService } from './project-sequence.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class BoqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ProjectSequenceService,
  ) {}

  async createBoq(dto: any, actorId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const boqNumber = await this.sequenceService.getNextBoqNumber(dto.projectId);

    let subtotal = new Prisma.Decimal(0);
    const linesData = dto.lines.map((l: any, idx: number) => {
      const qty = new Prisma.Decimal(l.quantity);
      const rate = new Prisma.Decimal(l.estimatedRate);
      const amount = qty.mul(rate);
      subtotal = subtotal.add(amount);

      return {
        lineNumber: l.lineNumber || idx + 1,
        sectionCode: l.sectionCode,
        itemCode: l.itemCode,
        description: l.description,
        specification: l.specification,
        quantity: qty,
        uomId: l.uomId,
        uomName: l.uomName,
        estimatedRate: rate,
        estimatedAmount: amount,
        costCategory: l.costCategory,
        fundId: l.fundId || project.fundId,
        costCenterId: l.costCenterId || project.costCenterId,
        notes: l.notes,
      };
    });

    const tax = subtotal.mul(new Prisma.Decimal(0.05)); // 5% tax estimate
    const cont = subtotal.mul(new Prisma.Decimal(0.05)); // 5% contingency
    const total = subtotal.add(tax).add(cont);

    const boq = await this.prisma.billOfQuantities.create({
      data: {
        projectId: dto.projectId,
        boqNumber,
        revisionNumber: 1,
        isCurrentRevision: true,
        name: dto.name,
        status: 'DRAFT',
        currency: dto.currency || 'INR',
        preparedById: actorId,
        subtotal,
        taxEstimate: tax,
        contingency: cont,
        totalEstimate: total,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        lines: { create: linesData },
      },
      include: { lines: true },
    });

    return boq;
  }

  async getBoqs(projectId: string) {
    return this.prisma.billOfQuantities.findMany({
      where: { projectId },
      include: { lines: true },
      orderBy: { revisionNumber: 'desc' },
    });
  }

  async getBoqById(id: string) {
    const boq = await this.prisma.billOfQuantities.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!boq) throw new NotFoundException('BOQ not found');
    return boq;
  }

  async approveBoq(id: string, actorId?: string) {
    const boq = await this.prisma.billOfQuantities.findUnique({ where: { id } });
    if (!boq) throw new NotFoundException('BOQ not found');

    return this.prisma.billOfQuantities.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: actorId,
        approvedAt: new Date(),
      },
      include: { lines: true },
    });
  }

  async reviseBoq(dto: any, actorId?: string) {
    const currentBoq = await this.prisma.billOfQuantities.findUnique({
      where: { id: dto.boqId },
      include: { lines: true },
    });
    if (!currentBoq) throw new NotFoundException('Current BOQ not found');

    // Supersede old revision
    await this.prisma.billOfQuantities.update({
      where: { id: currentBoq.id },
      data: { isCurrentRevision: false, status: 'SUPERSEDED' },
    });

    let subtotal = new Prisma.Decimal(0);
    const linesData = dto.lines.map((l: any, idx: number) => {
      const qty = new Prisma.Decimal(l.quantity);
      const rate = new Prisma.Decimal(l.estimatedRate);
      const amount = qty.mul(rate);
      subtotal = subtotal.add(amount);

      return {
        lineNumber: l.lineNumber || idx + 1,
        sectionCode: l.sectionCode,
        itemCode: l.itemCode,
        description: l.description,
        specification: l.specification,
        quantity: qty,
        uomName: l.uomName,
        estimatedRate: rate,
        estimatedAmount: amount,
        costCategory: l.costCategory,
        fundId: l.fundId,
        costCenterId: l.costCenterId,
        notes: l.notes,
      };
    });

    const tax = subtotal.mul(new Prisma.Decimal(0.05));
    const cont = subtotal.mul(new Prisma.Decimal(0.05));
    const total = subtotal.add(tax).add(cont);

    return this.prisma.billOfQuantities.create({
      data: {
        projectId: currentBoq.projectId,
        boqNumber: currentBoq.boqNumber,
        revisionNumber: currentBoq.revisionNumber + 1,
        isCurrentRevision: true,
        name: `${currentBoq.name} (Rev ${currentBoq.revisionNumber + 1})`,
        status: 'DRAFT',
        preparedById: actorId,
        subtotal,
        taxEstimate: tax,
        contingency: cont,
        totalEstimate: total,
        revisionReason: dto.revisionReason,
        lines: { create: linesData },
      },
      include: { lines: true },
    });
  }
}
