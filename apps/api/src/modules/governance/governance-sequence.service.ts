import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class GovernanceSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextMeetingNumber(communityId: string, prefix = 'MTG'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.governanceMeeting.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (
      await this.prisma.governanceMeeting.findUnique({ where: { meetingNumber: candidate } })
    ) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextResolutionNumber(communityId: string, prefix = 'RES'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.governanceResolution.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (
      await this.prisma.governanceResolution.findUnique({ where: { resolutionNumber: candidate } })
    ) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextNoticeNumber(communityId: string, prefix = 'NOT'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.governanceNotice.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.governanceNotice.findUnique({ where: { noticeNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextPolicyNumber(communityId: string, prefix = 'POL'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.governancePolicy.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.governancePolicy.findUnique({ where: { policyNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }
}
