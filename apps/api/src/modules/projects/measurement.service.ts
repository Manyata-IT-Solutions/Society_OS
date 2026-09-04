import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectSequenceService } from './project-sequence.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class MeasurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ProjectSequenceService,
  ) {}

  async submitMeasurement(dto: any, actorId?: string) {
    const boqLine = await this.prisma.boqLine.findUnique({ where: { id: dto.boqLineId } });
    if (!boqLine) throw new NotFoundException('BOQ Line not found');

    const reqQty = new Prisma.Decimal(dto.measuredQuantity);
    const totalAfter = boqLine.measuredQuantity.add(reqQty);

    // Quantity ceiling validation: Measured cannot exceed allowed BOQ qty
    if (totalAfter.gt(boqLine.quantity)) {
      throw new BadRequestException(
        `Measurement quantity (${reqQty}) exceeds allowable BOQ remaining quantity (${boqLine.quantity.sub(boqLine.measuredQuantity)})`,
      );
    }

    const measurementNumber = await this.sequenceService.getNextMeasurementNumber(dto.projectId);

    return this.prisma.projectMeasurement.create({
      data: {
        projectId: dto.projectId,
        workPackageId: dto.workPackageId,
        boqLineId: dto.boqLineId,
        measurementNumber,
        measurementDate: dto.measurementDate ? new Date(dto.measurementDate) : new Date(),
        location: dto.location,
        measuredQuantity: reqQty,
        uomName: dto.uomName || boqLine.uomName,
        measurementDetails: dto.measurementDetails,
        status: 'SUBMITTED',
        measuredById: actorId,
        documentId: dto.documentId,
      },
    });
  }

  async getMeasurements(projectId: string, workPackageId?: string) {
    return this.prisma.projectMeasurement.findMany({
      where: {
        projectId,
        ...(workPackageId && { workPackageId }),
      },
      include: { boqLine: true, workPackage: true },
      orderBy: { measurementDate: 'desc' },
    });
  }

  async verifyMeasurement(
    dto: { measurementId: string; approved: boolean; rejectionReason?: string },
    actorId?: string,
  ) {
    const meas = await this.prisma.projectMeasurement.findUnique({
      where: { id: dto.measurementId },
      include: { boqLine: true },
    });
    if (!meas) throw new NotFoundException('Measurement not found');
    if (meas.status !== 'SUBMITTED')
      throw new BadRequestException('Only SUBMITTED measurements can be verified');

    if (!dto.approved) {
      return this.prisma.projectMeasurement.update({
        where: { id: dto.measurementId },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          verifiedById: actorId,
          verifiedAt: new Date(),
        },
      });
    }

    // Atomic update of BOQ line measured quantity & verification
    return this.prisma.$transaction(async (tx) => {
      const line = await tx.boqLine.findUnique({ where: { id: meas.boqLineId } });
      if (!line) throw new NotFoundException('BOQ line missing');

      const _updatedLine = await tx.boqLine.update({
        where: { id: meas.boqLineId },
        data: {
          measuredQuantity: line.measuredQuantity.add(meas.measuredQuantity),
        },
      });

      return tx.projectMeasurement.update({
        where: { id: dto.measurementId },
        data: {
          status: 'VERIFIED',
          verifiedById: actorId,
          verifiedAt: new Date(),
        },
      });
    });
  }
}
