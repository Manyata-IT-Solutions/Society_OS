import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectSequenceService } from './project-sequence.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CertificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ProjectSequenceService,
  ) {}

  async createCertificate(dto: any, _actorId?: string) {
    const wp = await this.prisma.projectWorkPackage.findUnique({
      where: { id: dto.workPackageId },
    });
    if (!wp) throw new NotFoundException('Work Package not found');

    const certificateNumber = await this.sequenceService.getNextCertificateNumber(dto.projectId);

    let grossAmount = new Prisma.Decimal(0);
    const certLinesData: any[] = [];

    for (const item of dto.lines) {
      const line = await this.prisma.boqLine.findUnique({ where: { id: item.boqLineId } });
      if (!line) throw new NotFoundException(`BOQ Line ${item.boqLineId} not found`);

      const certQty = new Prisma.Decimal(item.certifiedQuantity);
      const totalCert = line.certifiedQuantity.add(certQty);

      // Prevent over-certification beyond verified measured quantity
      if (totalCert.gt(line.measuredQuantity)) {
        throw new BadRequestException(
          `Certified quantity (${certQty}) exceeds remaining verified measured quantity (${line.measuredQuantity.sub(line.certifiedQuantity)})`,
        );
      }

      const curAmount = certQty.mul(line.estimatedRate);
      const cumAmount = totalCert.mul(line.estimatedRate);
      grossAmount = grossAmount.add(curAmount);

      certLinesData.push({
        boqLineId: line.id,
        previouslyCertifiedQty: line.certifiedQuantity,
        currentMeasuredQty: line.measuredQuantity,
        currentCertifiedQty: certQty,
        cumulativeCertifiedQty: totalCert,
        unitRate: line.estimatedRate,
        currentAmount: curAmount,
        cumulativeAmount: cumAmount,
      });
    }

    const retPct = wp.retentionPercent.div(new Prisma.Decimal(100));
    const retentionAmount = grossAmount.mul(retPct);
    const advRecovery = new Prisma.Decimal(dto.advanceRecovery || 0);
    const deductions = new Prisma.Decimal(dto.otherDeductions || 0);
    const netAmount = grossAmount.sub(retentionAmount).sub(advRecovery).sub(deductions);

    return this.prisma.$transaction(async (tx) => {
      const cert = await tx.projectProgressCertificate.create({
        data: {
          projectId: dto.projectId,
          vendorId: dto.vendorId,
          workPackageId: dto.workPackageId,
          certificateNumber,
          periodStart: new Date(dto.periodStart),
          periodEnd: new Date(dto.periodEnd),
          status: 'SUBMITTED',
          grossCertifiedAmount: grossAmount,
          retentionAmount,
          advanceRecovery: advRecovery,
          otherDeductions: deductions,
          netCertifiedAmount: netAmount,
          notes: dto.notes,
          lines: { create: certLinesData },
        },
        include: { lines: true },
      });

      return cert;
    });
  }

  async getCertificates(projectId: string, vendorId?: string) {
    return this.prisma.projectProgressCertificate.findMany({
      where: {
        projectId,
        ...(vendorId && { vendorId }),
      },
      include: { lines: { include: { boqLine: true } }, vendor: true, workPackage: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCertificate(id: string, actorId?: string) {
    const cert = await this.prisma.projectProgressCertificate.findUnique({
      where: { id },
      include: { lines: true, workPackage: true },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    if (cert.status !== 'SUBMITTED' && cert.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Certificate already approved or cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update BOQ lines certified and billed quantity
      for (const cl of cert.lines) {
        await tx.boqLine.update({
          where: { id: cl.boqLineId },
          data: {
            certifiedQuantity: cl.cumulativeCertifiedQty,
            billedQuantity: cl.cumulativeCertifiedQty,
          },
        });
      }

      // 2. Update Retention Register
      if (cert.retentionAmount.gt(0)) {
        const existingRet = await tx.projectRetention.findUnique({
          where: {
            workPackageId_vendorId: {
              workPackageId: cert.workPackageId,
              vendorId: cert.vendorId,
            },
          },
        });

        if (existingRet) {
          const newWithheld = existingRet.totalWithheld.add(cert.retentionAmount);
          const newBal = newWithheld.sub(existingRet.totalReleased);
          await tx.projectRetention.update({
            where: { id: existingRet.id },
            data: {
              totalWithheld: newWithheld,
              balanceRemaining: newBal,
            },
          });
        } else {
          await tx.projectRetention.create({
            data: {
              projectId: cert.projectId,
              workPackageId: cert.workPackageId,
              vendorId: cert.vendorId,
              retentionNumber: `RET-${cert.certificateNumber}`,
              totalWithheld: cert.retentionAmount,
              balanceRemaining: cert.retentionAmount,
              status: 'WITHHELD',
            },
          });
        }
      }

      // 3. Mark Certificate APPROVED
      const approvedCert = await tx.projectProgressCertificate.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: actorId,
          approvedAt: new Date(),
        },
      });

      // 4. Update Financial Projection
      const fin = await tx.projectFinancialSummary.findUnique({
        where: { projectId: cert.projectId },
      });
      if (fin) {
        const newGross = fin.grossCertified.add(cert.grossCertifiedAmount);
        const newRet = fin.retentionWithheld.add(cert.retentionAmount);
        const newAdv = fin.advanceRecovered.add(cert.advanceRecovery);
        const newNet = fin.netCertified.add(cert.netCertifiedAmount);

        await tx.projectFinancialSummary.update({
          where: { projectId: cert.projectId },
          data: {
            grossCertified: newGross,
            retentionWithheld: newRet,
            advanceRecovered: newAdv,
            netCertified: newNet,
            invoiced: fin.invoiced.add(cert.netCertifiedAmount),
            actualGl: fin.actualGl.add(cert.netCertifiedAmount),
          },
        });
      }

      return approvedCert;
    });
  }
}
