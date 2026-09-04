import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateWatchlistEntryDto, SecurityOverrideDto } from '@community-os/contracts';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async createEntry(dto: CreateWatchlistEntryDto, userId?: string) {
    const normalizedKey = dto.subjectIdentifier.replace(/[^0-9A-Z]/gi, '');
    let creatorId = userId;
    if (!creatorId) {
      const user = await this.prisma.user.findFirst();
      creatorId = user!.id;
    }

    return this.prisma.watchlistEntry.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        subjectType: (dto.subjectType as any) || 'VEHICLE',
        subjectIdentifier: dto.subjectIdentifier,
        normalizedKey,
        severity: (dto.severity as any) || 'MEDIUM',
        action: dto.action || 'WARN',
        reason: dto.reason,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        status: 'ACTIVE',
        createdBy: { connect: { id: creatorId } },
      },
    });
  }

  async getEntries(communityId: string) {
    return this.prisma.watchlistEntry.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOverride(dto: SecurityOverrideDto, supervisorId?: string) {
    const gate = await this.prisma.securityGate.findUnique({ where: { id: dto.gateId } });
    let authSupervisorId = supervisorId;
    if (!authSupervisorId) {
      const user = await this.prisma.user.findFirst();
      authSupervisorId = user!.id;
    }

    return this.prisma.securityOverrideLog.create({
      data: {
        organization: { connect: { id: gate!.organizationId } },
        community: { connect: { id: gate!.communityId } },
        gate: { connect: { id: dto.gateId } },
        visit: dto.visitId ? { connect: { id: dto.visitId } } : undefined,
        visitorName: dto.visitorName,
        reason: dto.reason,
        actionTaken: dto.actionTaken,
        authorizedBySupervisor: { connect: { id: authSupervisorId } },
      },
    });
  }
}
