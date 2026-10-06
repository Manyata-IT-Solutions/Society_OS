import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class EmergencyContactService {
  constructor(private readonly prisma: PrismaService) {}

  async listContacts(communityId: string) {
    return this.prisma.emergencyContactDirectory.findMany({
      where: { communityId },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
