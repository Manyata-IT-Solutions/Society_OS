import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SecuritySequenceService } from './security-sequence.service.js';
import { PassCredentialService } from './pass-credential.service.js';
import { InviteVisitorDto, CreateWalkInVisitDto } from '@community-os/contracts';
import * as crypto from 'node:crypto';

@Injectable()
export class VisitorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SecuritySequenceService,
    private readonly credService: PassCredentialService,
  ) {}

  async inviteVisitor(dto: InviteVisitorDto, userId?: string) {
    // Verify destination unit exists
    const unit = await this.prisma.unit.findUnique({ where: { id: dto.destinationUnitId } });
    if (!unit) throw new NotFoundException('Destination Unit not found.');

    // Find host resident
    const resident =
      (await this.prisma.resident.findFirst({
        where: { communityId: dto.communityId, userId: userId || undefined },
      })) || (await this.prisma.resident.findFirst({ where: { communityId: dto.communityId } }));

    if (!resident) throw new BadRequestException('No valid host resident found.');

    const invitationNumber = await this.sequenceService.generateInvitationNumber(dto.communityId);
    const passNumber = await this.sequenceService.generatePassNumber(dto.communityId);
    const { rawToken, hash, preview } = this.credService.generateSecureToken();

    // Create or find visitor profile
    const phoneHash = dto.phone
      ? crypto.createHash('sha256').update(dto.phone).digest('hex')
      : null;
    let visitor = phoneHash
      ? await this.prisma.visitorProfile.findFirst({
          where: { communityId: dto.communityId, phoneHash },
        })
      : null;

    if (!visitor) {
      visitor = await this.prisma.visitorProfile.create({
        data: {
          organizationId: dto.organizationId,
          communityId: dto.communityId,
          name: dto.visitorName,
          phone: dto.phone,
          phoneHash,
          vehicleNumber: dto.vehicleNumber,
          normalizedVehicleNumber: dto.vehicleNumber?.replace(/[^0-9A-Z]/gi, ''),
        },
      });
    }

    const invitation = await this.prisma.visitorInvitation.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        invitationNumber,
        hostResidentId: resident.id,
        destinationUnitId: unit.id,
        visitorName: dto.visitorName,
        phone: dto.phone,
        visitType: (dto.visitType as any) || 'GUEST',
        purpose: dto.purpose || 'Personal Visit',
        expectedFrom: new Date(dto.expectedFrom),
        expectedUntil: new Date(dto.expectedUntil),
        entryCountLimit: 1,
        vehicleExpected: dto.vehicleExpected ?? false,
        vehicleNumber: dto.vehicleNumber,
        status: 'ACTIVE',
      },
    });

    const pass = await this.prisma.accessPass.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        passNumber,
        invitationId: invitation.id,
        passType: (dto.passType as any) || 'SINGLE_ENTRY',
        credentialType: 'QR',
        credentialHash: hash,
        rawTokenPreview: preview,
        validFrom: new Date(dto.expectedFrom),
        validUntil: new Date(dto.expectedUntil),
        entryLimit: 1,
        entriesUsed: 0,
        status: 'ACTIVE',
      },
    });

    return {
      invitation,
      pass,
      rawToken, // Provided once to resident/guest for QR generation
    };
  }

  async createWalkIn(dto: CreateWalkInVisitDto, _userId?: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.destinationUnitId },
      include: {
        occupancies: {
          where: { status: 'ACTIVE' },
          include: { household: { include: { primaryContact: true } } },
        },
      },
    });
    if (!unit) throw new NotFoundException('Destination unit not found.');

    const resident =
      unit.occupancies[0]?.household?.primaryContact ||
      (await this.prisma.resident.findFirst({ where: { communityId: dto.communityId } }));
    if (!resident)
      throw new BadRequestException('No host resident registered for destination unit.');

    const visitNumber = await this.sequenceService.generateVisitNumber(dto.communityId);
    const phoneHash = dto.phone
      ? crypto.createHash('sha256').update(dto.phone).digest('hex')
      : null;

    let visitor = phoneHash
      ? await this.prisma.visitorProfile.findFirst({
          where: { communityId: dto.communityId, phoneHash },
        })
      : null;

    if (!visitor) {
      visitor = await this.prisma.visitorProfile.create({
        data: {
          organizationId: dto.organizationId,
          communityId: dto.communityId,
          name: dto.visitorName,
          phone: dto.phone,
          phoneHash,
          vehicleNumber: dto.vehicleNumber,
          normalizedVehicleNumber: dto.vehicleNumber?.replace(/[^0-9A-Z]/gi, ''),
        },
      });
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours validity

    const visit = await this.prisma.visit.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        visitNumber,
        visitorId: visitor.id,
        visitType: (dto.visitType as any) || 'GUEST',
        purpose: dto.purpose || 'Walk-In Visit',
        hostResidentId: resident.id,
        destinationUnitId: unit.id,
        status: 'AWAITING_APPROVAL',
        expectedFrom: now,
        expectedUntil: expiry,
        entryGateId: dto.gateId,
        vehicleNumber: dto.vehicleNumber,
        approvalStatus: 'PENDING',
      },
    });

    const approval = await this.prisma.visitApproval.create({
      data: {
        visitId: visit.id,
        hostResidentId: resident.id,
        status: 'PENDING',
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 mins approval timeout
      },
    });

    return { visit, approval };
  }

  async revokePass(passId: string, userId?: string) {
    const pass = await this.prisma.accessPass.findUnique({ where: { id: passId } });
    if (!pass) throw new NotFoundException('Access Pass not found.');

    return this.prisma.accessPass.update({
      where: { id: passId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedById: userId,
      },
    });
  }
}
