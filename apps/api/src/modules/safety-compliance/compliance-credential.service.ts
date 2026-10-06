import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateComplianceCredentialDto,
  RenewComplianceCredentialDto,
} from '@community-os/contracts';

@Injectable()
export class ComplianceCredentialService {
  constructor(private readonly prisma: PrismaService) {}

  async createCredential(dto: CreateComplianceCredentialDto) {
    return this.prisma.complianceCredential.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        requirementId: dto.requirementId,
        credentialType: dto.credentialType,
        credentialNumber: dto.credentialNumber,
        title: dto.title,
        issuingAuthority: dto.issuingAuthority,
        validFrom: new Date(dto.validFrom),
        expiryDate: new Date(dto.expiryDate),
        assetId: dto.assetId,
        status: 'ACTIVE',
      },
    });
  }

  async renewCredential(dto: RenewComplianceCredentialDto) {
    const oldCred = await this.prisma.complianceCredential.findUnique({
      where: { id: dto.oldCredentialId },
    });
    if (!oldCred) throw new NotFoundException('Old credential not found');

    const newCred = await this.prisma.complianceCredential.create({
      data: {
        organizationId: oldCred.organizationId,
        communityId: oldCred.communityId,
        requirementId: oldCred.requirementId,
        credentialType: oldCred.credentialType,
        credentialNumber: dto.newCredentialNumber,
        title: oldCred.title,
        issuingAuthority: oldCred.issuingAuthority,
        validFrom: new Date(dto.validFrom),
        expiryDate: new Date(dto.expiryDate),
        assetId: oldCred.assetId,
        status: 'ACTIVE',
      },
    });

    await this.prisma.complianceCredential.update({
      where: { id: dto.oldCredentialId },
      data: { status: 'SUPERSEDED', supersededById: newCred.id },
    });

    return newCred;
  }

  async listCredentials(communityId: string) {
    return this.prisma.complianceCredential.findMany({
      where: { communityId },
      include: { requirement: true, asset: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
