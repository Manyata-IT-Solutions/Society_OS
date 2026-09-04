import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateExecutiveAlertDto } from '@community-os/contracts';

@Injectable()
export class ExecutiveAlertCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async createAlert(dto: CreateExecutiveAlertDto) {
    // Deduplicate active alert of same type and domain
    const existing = await this.prisma.analyticsAlert.findFirst({
      where: {
        alertType: dto.alertType,
        sourceDomain: dto.sourceDomain,
        communityId: dto.communityId,
        status: 'OPEN',
      },
    });
    if (existing) return existing;

    return this.prisma.analyticsAlert.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        alertType: dto.alertType,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        sourceDomain: dto.sourceDomain,
        conditionPayload: dto.conditionPayload,
        status: 'OPEN',
      },
    });
  }

  async acknowledgeAlert(alertId: string) {
    const alert = await this.prisma.analyticsAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    return this.prisma.analyticsAlert.update({
      where: { id: alertId },
      data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
    });
  }

  async listAlerts(communityId?: string, status = 'OPEN') {
    const where: any = {};
    if (communityId) where.communityId = communityId;
    if (status) where.status = status;

    return this.prisma.analyticsAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
