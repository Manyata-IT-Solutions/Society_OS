import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class SecuritySequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateVisitNumber(communityId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.visit.count({ where: { communityId } });
    const seq = (count + 1).toString().padStart(6, '0');
    return `VIS-${year}-${seq}`;
  }

  async generateInvitationNumber(communityId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.visitorInvitation.count({ where: { communityId } });
    const seq = (count + 1).toString().padStart(6, '0');
    return `INV-${year}-${seq}`;
  }

  async generatePassNumber(communityId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.accessPass.count({ where: { communityId } });
    const seq = (count + 1).toString().padStart(6, '0');
    return `PASS-${year}-${seq}`;
  }
}
