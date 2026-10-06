import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateProxyAuthorizationDto } from '@community-os/contracts';

@Injectable()
export class GovernanceProxyService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProxy(dto: CreateProxyAuthorizationDto, verifiedById?: string) {
    const existing = await this.prisma.governanceProxyAuthorization.findUnique({
      where: {
        meetingId_principalResidentId: {
          meetingId: dto.meetingId,
          principalResidentId: dto.principalResidentId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        'A proxy authorization already exists for this principal in this meeting',
      );
    }

    return this.prisma.governanceProxyAuthorization.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        meetingId: dto.meetingId,
        principalResidentId: dto.principalResidentId,
        proxyResidentId: dto.proxyResidentId,
        validityDate: new Date(dto.validityDate),
        scope: dto.scope,
        supportingDocumentId: dto.supportingDocumentId,
        status: 'VERIFIED',
        verifiedById,
        verifiedAt: new Date(),
      },
      include: { principalResident: true, proxyResident: true },
    });
  }
}
