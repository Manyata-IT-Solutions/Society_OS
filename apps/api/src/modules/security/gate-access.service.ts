import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SecuritySequenceService } from './security-sequence.service.js';
import { PassCredentialService } from './pass-credential.service.js';
import { SecurityAccessDecisionService } from './security-access-decision.service.js';
import {
  ValidatePassDto,
  CheckInVisitDto,
  CheckOutVisitDto,
  ManualCheckoutDto,
} from '@community-os/contracts';

@Injectable()
export class GateAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SecuritySequenceService,
    private readonly credService: PassCredentialService,
    private readonly decisionService: SecurityAccessDecisionService,
  ) {}

  async validateAndCheckInByPass(dto: ValidatePassDto, operatorId?: string) {
    if (!dto.rawToken && !dto.otp) {
      throw new BadRequestException('Provide rawToken or otp to validate pass.');
    }

    const hash = dto.rawToken
      ? this.credService.hashCredential(dto.rawToken)
      : this.credService.hashCredential(dto.otp!);

    const evalResult = await this.decisionService.evaluatePassAccess(dto.gateId, hash);
    if (evalResult.decision !== 'ALLOW') {
      throw new BadRequestException(`Access Denied: ${evalResult.reason}`);
    }

    const pass = await this.prisma.accessPass.findUnique({
      where: { id: evalResult.passId },
      include: {
        invitation: { include: { destinationUnit: true, hostResident: true } },
      },
    });
    if (!pass) throw new NotFoundException('Pass record missing.');

    const now = new Date();

    // Atomic transaction for single-entry concurrency protection
    return this.prisma.$transaction(async (tx) => {
      // Re-check entry limit inside transaction
      const currentPass = await tx.accessPass.findUnique({ where: { id: pass.id } });
      if (currentPass!.entryLimit > 0 && currentPass!.entriesUsed >= currentPass!.entryLimit) {
        throw new BadRequestException('Access Denied: Pass entry limit already consumed.');
      }

      await tx.accessPass.update({
        where: { id: pass.id },
        data: {
          entriesUsed: { increment: 1 },
          status:
            currentPass!.entriesUsed + 1 >= currentPass!.entryLimit ? 'USED' : 'PARTIALLY_USED',
        },
      });

      // Find or create visitor
      const phoneHash = pass.invitation?.phone
        ? this.credService.hashCredential(pass.invitation.phone)
        : null;
      let visitor = phoneHash
        ? await tx.visitorProfile.findFirst({
            where: { communityId: pass.communityId, phoneHash },
          })
        : null;

      if (!visitor) {
        visitor = await tx.visitorProfile.create({
          data: {
            organizationId: pass.organizationId,
            communityId: pass.communityId,
            name: pass.invitation?.visitorName || 'Guest Visitor',
            phone: pass.invitation?.phone,
            phoneHash,
            vehicleNumber: pass.invitation?.vehicleNumber,
          },
        });
      }

      const visitNumber = await this.sequenceService.generateVisitNumber(pass.communityId);

      const visit = await tx.visit.create({
        data: {
          organizationId: pass.organizationId,
          communityId: pass.communityId,
          visitNumber,
          visitorId: visitor.id,
          visitType: pass.invitation?.visitType || 'GUEST',
          purpose: pass.invitation?.purpose,
          hostResidentId: pass.invitation?.hostResidentId,
          destinationUnitId: pass.invitation?.destinationUnitId,
          invitationId: pass.invitationId,
          passId: pass.id,
          status: 'ACTIVE',
          expectedFrom: pass.validFrom,
          expectedUntil: pass.validUntil,
          actualCheckIn: now,
          entryGateId: dto.gateId,
          vehicleNumber: pass.invitation?.vehicleNumber,
          approvalStatus: 'APPROVED',
        },
      });

      // Immutable Gate Access Event
      await tx.gateAccessEvent.create({
        data: {
          organizationId: pass.organizationId,
          communityId: pass.communityId,
          visitId: visit.id,
          visitorId: visitor.id,
          gateId: dto.gateId,
          eventType: 'CHECK_IN',
          credentialType: pass.credentialType,
          decision: 'ALLOW',
          decisionReason: 'Valid pre-approved QR pass scanned',
          destinationUnitId: pass.invitation?.destinationUnitId,
          operatorId,
          eventTime: now,
        },
      });

      // ActiveVisit projection
      await tx.activeVisit.create({
        data: {
          visitId: visit.id,
          organizationId: pass.organizationId,
          communityId: pass.communityId,
          visitorId: visitor.id,
          visitorName: pass.invitation?.visitorName || 'Guest Visitor',
          visitType: pass.invitation?.visitType || 'GUEST',
          destinationUnitNumber: pass.invitation?.destinationUnit?.unitNumber || '101',
          checkInTime: now,
          entryGateId: dto.gateId,
          vehicleNumber: pass.invitation?.vehicleNumber,
        },
      });

      return visit;
    });
  }

  async checkInWalkIn(dto: CheckInVisitDto, operatorId?: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: dto.visitId },
      include: { visitor: true, destinationUnit: true },
    });
    if (!visit) throw new NotFoundException('Visit not found.');
    if (visit.approvalStatus !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot check-in visit with approval status: ${visit.approvalStatus}`,
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedVisit = await tx.visit.update({
        where: { id: visit.id },
        data: {
          status: 'ACTIVE',
          actualCheckIn: now,
          entryGateId: dto.gateId,
          vehicleNumber: dto.vehicleNumber || visit.vehicleNumber,
        },
      });

      await tx.gateAccessEvent.create({
        data: {
          organizationId: visit.organizationId,
          communityId: visit.communityId,
          visitId: visit.id,
          visitorId: visit.visitorId,
          gateId: dto.gateId,
          eventType: 'CHECK_IN',
          decision: 'ALLOW',
          decisionReason: 'Resident approved walk-in visit',
          destinationUnitId: visit.destinationUnitId,
          operatorId,
          eventTime: now,
        },
      });

      await tx.activeVisit.upsert({
        where: { visitId: visit.id },
        update: { checkInTime: now, entryGateId: dto.gateId },
        create: {
          visitId: visit.id,
          organizationId: visit.organizationId,
          communityId: visit.communityId,
          visitorId: visit.visitorId,
          visitorName: visit.visitor.name,
          visitType: visit.visitType,
          destinationUnitNumber: visit.destinationUnit?.unitNumber,
          checkInTime: now,
          entryGateId: dto.gateId,
          vehicleNumber: dto.vehicleNumber || visit.vehicleNumber,
        },
      });

      return updatedVisit;
    });
  }

  async checkOut(dto: CheckOutVisitDto, operatorId?: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id: dto.visitId } });
    if (!visit) throw new NotFoundException('Visit not found.');

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedVisit = await tx.visit.update({
        where: { id: visit.id },
        data: {
          status: 'CHECKED_OUT',
          actualCheckOut: now,
          exitGateId: dto.gateId,
        },
      });

      await tx.gateAccessEvent.create({
        data: {
          organizationId: visit.organizationId,
          communityId: visit.communityId,
          visitId: visit.id,
          visitorId: visit.visitorId,
          gateId: dto.gateId,
          eventType: 'CHECK_OUT',
          decision: 'ALLOW',
          decisionReason: 'Normal gate departure',
          destinationUnitId: visit.destinationUnitId,
          operatorId,
          eventTime: now,
        },
      });

      // Remove from ActiveVisit projection
      await tx.activeVisit.deleteMany({ where: { visitId: visit.id } });

      return updatedVisit;
    });
  }

  async manualCheckout(dto: ManualCheckoutDto, supervisorId?: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id: dto.visitId } });
    if (!visit) throw new NotFoundException('Visit not found.');

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedVisit = await tx.visit.update({
        where: { id: visit.id },
        data: {
          status: 'CHECKED_OUT',
          actualCheckOut: now,
          exitGateId: dto.gateId,
        },
      });

      await tx.gateAccessEvent.create({
        data: {
          organizationId: visit.organizationId,
          communityId: visit.communityId,
          visitId: visit.id,
          visitorId: visit.visitorId,
          gateId: dto.gateId,
          eventType: 'MANUAL_CORRECTION',
          decision: 'ALLOW',
          decisionReason: `Manual checkout by supervisor: ${dto.reason}`,
          operatorId: supervisorId,
          eventTime: now,
        },
      });

      await tx.activeVisit.deleteMany({ where: { visitId: visit.id } });

      return updatedVisit;
    });
  }
}
