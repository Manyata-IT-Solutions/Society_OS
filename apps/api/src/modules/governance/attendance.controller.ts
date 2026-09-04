import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PrismaService } from '../database/prisma.service.js';
import { GovernanceEligibilityService } from './governance-eligibility.service.js';
import { GovernanceQuorumService } from './governance-quorum.service.js';
import { GovernanceProxyService } from './governance-proxy.service.js';
import {
  RecordMeetingAttendanceDto,
  EvaluateQuorumDto,
  CreateProxyAuthorizationDto,
} from '@community-os/contracts';

@Controller('governance/attendance')
@UseGuards(AuthGuard)
export class GovernanceAttendanceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: GovernanceEligibilityService,
    private readonly quorumService: GovernanceQuorumService,
    private readonly proxyService: GovernanceProxyService,
  ) {}

  @Post('check-in')
  async recordAttendance(@Body() dto: RecordMeetingAttendanceDto) {
    return this.prisma.meetingAttendance.create({
      data: {
        meetingId: dto.meetingId,
        participantType: dto.participantType || 'RESIDENT',
        residentId: dto.residentId,
        userId: dto.userId,
        committeeMembershipId: dto.committeeMembershipId,
        proxyAuthorizationId: dto.proxyReferenceId,
        attendanceStatus: dto.attendanceStatus || 'PRESENT',
        checkInAt: new Date(),
        verificationMethod: 'DIGITAL',
      },
    });
  }

  @Post('eligibility-snapshot/:meetingId')
  async captureEligibilitySnapshot(@Param('meetingId') meetingId: string) {
    return this.eligibilityService.createEligibilitySnapshot(meetingId);
  }

  @Post('quorum/evaluate')
  async evaluateQuorum(@Body() dto: EvaluateQuorumDto) {
    return this.quorumService.evaluateQuorum(dto);
  }

  @Post('proxies')
  async submitProxy(@Body() dto: CreateProxyAuthorizationDto, @Req() req: any) {
    return this.proxyService.submitProxy(dto, req.user?.id);
  }
}
