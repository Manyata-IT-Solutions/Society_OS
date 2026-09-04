import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class QualitySnagService {
  constructor(private readonly prisma: PrismaService) {}

  async recordInspection(dto: any, actorId?: string) {
    return this.prisma.projectInspection.create({
      data: {
        projectId: dto.projectId,
        workPackageId: dto.workPackageId,
        inspectionType: dto.inspectionType || 'WORKMANSHIP',
        title: dto.title,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : new Date(),
        inspectorName: dto.inspectorName,
        result: dto.result || 'PASS',
        observations: dto.observations,
        correctiveActions: dto.correctiveActions,
        documentId: dto.documentId,
        createdById: actorId,
      },
    });
  }

  async getInspections(projectId: string) {
    return this.prisma.projectInspection.findMany({
      where: { projectId },
      orderBy: { inspectionDate: 'desc' },
    });
  }

  async createSnag(dto: any, actorId?: string) {
    return this.prisma.projectSnag.create({
      data: {
        projectId: dto.projectId,
        location: dto.location,
        title: dto.title,
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        assignedVendorId: dto.assignedVendorId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: 'OPEN',
        isBlockingHandover:
          dto.isBlockingHandover ?? (dto.severity === 'CRITICAL' || dto.severity === 'HIGH'),
        evidenceDocId: dto.evidenceDocId,
        createdById: actorId,
      },
    });
  }

  async getSnags(projectId: string) {
    return this.prisma.projectSnag.findMany({
      where: { projectId },
      include: { assignedVendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveSnag(id: string, resolutionDocId?: string, _actorId?: string) {
    return this.prisma.projectSnag.update({
      where: { id },
      data: {
        status: 'CLOSED',
        resolutionEvidenceDocId: resolutionDocId,
      },
    });
  }
}
