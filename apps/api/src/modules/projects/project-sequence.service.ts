import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ProjectSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextProjectNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.project.count({ where: { organizationId } });
    return `PRJ-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async getNextBoqNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.billOfQuantities.count({ where: { projectId } });
    return `BOQ-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async getNextPackageNumber(projectId: string): Promise<string> {
    const count = await this.prisma.projectWorkPackage.count({ where: { projectId } });
    return `PKG-${String(count + 1).padStart(3, '0')}`;
  }

  async getNextMeasurementNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.projectMeasurement.count({ where: { projectId } });
    return `MB-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async getNextCertificateNumber(projectId: string): Promise<string> {
    const count = await this.prisma.projectProgressCertificate.count({ where: { projectId } });
    return `IPC-${String(count + 1).padStart(4, '0')}`;
  }

  async getNextVariationNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.projectVariation.count({ where: { projectId } });
    return `VAR-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async getNextHandoverNumber(projectId: string): Promise<string> {
    const count = await this.prisma.projectHandover.count({ where: { projectId } });
    return `HND-${String(count + 1).padStart(4, '0')}`;
  }
}
