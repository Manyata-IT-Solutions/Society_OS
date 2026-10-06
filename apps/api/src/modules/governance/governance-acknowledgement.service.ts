import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AcknowledgeNoticeDto } from '@community-os/contracts';

@Injectable()
export class GovernanceAcknowledgementService {
  constructor(private readonly prisma: PrismaService) {}

  async recordNoticeRead(noticeId: string, residentId?: string, userId?: string) {
    if (!residentId) return null;
    const existing = await this.prisma.noticeReadReceipt.findUnique({
      where: { noticeId_residentId: { noticeId, residentId } },
    });
    if (existing) {
      return this.prisma.noticeReadReceipt.update({
        where: { id: existing.id },
        data: { lastReadAt: new Date() },
      });
    }

    return this.prisma.noticeReadReceipt.create({
      data: {
        noticeId,
        residentId,
        userId,
        firstReadAt: new Date(),
      },
    });
  }

  async acknowledgeNotice(dto: AcknowledgeNoticeDto, userId?: string) {
    const existing = await this.prisma.noticeAcknowledgement.findUnique({
      where: { noticeId_residentId: { noticeId: dto.noticeId, residentId: dto.residentId } },
    });
    if (existing) return existing;

    const ack = await this.prisma.noticeAcknowledgement.create({
      data: {
        noticeId: dto.noticeId,
        residentId: dto.residentId,
        userId,
        acknowledgedAt: new Date(),
        method: dto.method || 'IN_APP',
        status: 'ACKNOWLEDGED',
      },
    });

    return ack;
  }
}
