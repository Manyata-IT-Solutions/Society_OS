import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateDeploymentDto } from '@community-os/contracts';

@Injectable()
export class WorkforceDeploymentService {
  constructor(private readonly prisma: PrismaService) {}

  async createDeployment(dto: CreateDeploymentDto) {
    return this.prisma.workforceDeployment.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        worker: { connect: { id: dto.workerId } },
        targetType: dto.targetType,
        project:
          dto.targetType === 'PROJECT' && dto.targetId
            ? { connect: { id: dto.targetId } }
            : undefined,
        locationName: dto.locationName,
        roleName: dto.roleName,
        validFrom: new Date(dto.validFrom),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        status: 'ACTIVE',
      },
    });
  }

  async getDeployments(communityId: string, targetType?: string) {
    return this.prisma.workforceDeployment.findMany({
      where: {
        communityId,
        ...(targetType ? { targetType } : {}),
      },
      include: { worker: true },
      orderBy: { validFrom: 'desc' },
    });
  }
}
