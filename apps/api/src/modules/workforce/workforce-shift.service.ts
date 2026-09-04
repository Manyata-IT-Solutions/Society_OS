import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateShiftTemplateDto, GenerateShiftInstancesDto } from '@community-os/contracts';

@Injectable()
export class WorkforceShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async createTemplate(dto: CreateShiftTemplateDto) {
    return this.prisma.shiftTemplate.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: dto.communityId ? { connect: { id: dto.communityId } } : undefined,
        code: dto.code,
        name: dto.name,
        startLocalTime: dto.startLocalTime,
        endLocalTime: dto.endLocalTime,
        breakMinutes: dto.breakMinutes || 30,
        crossesMidnight: dto.crossesMidnight ?? false,
      },
    });
  }

  async getTemplates(organizationId: string) {
    return this.prisma.shiftTemplate.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
    });
  }

  async generateShiftInstances(dto: GenerateShiftInstancesDto) {
    const template = await this.prisma.shiftTemplate.findUnique({
      where: { id: dto.shiftTemplateId },
    });
    if (!template) throw new NotFoundException('Shift template not found');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const createdInstances = [];

    const startH = Number(template.startLocalTime.split(':')[0]) || 0;
    const startM = Number(template.startLocalTime.split(':')[1]) || 0;
    const endH = Number(template.endLocalTime.split(':')[0]) || 0;
    const endM = Number(template.endLocalTime.split(':')[1]) || 0;

    const cur = new Date(start);
    while (cur <= end) {
      const shiftStart = new Date(cur);
      shiftStart.setHours(startH, startM, 0, 0);

      const shiftEnd = new Date(cur);
      if (template.crossesMidnight) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }
      shiftEnd.setHours(endH, endM, 0, 0);

      const instance = await this.prisma.shiftInstance.create({
        data: {
          community: { connect: { id: dto.communityId } },
          shiftTemplate: { connect: { id: template.id } },
          startAt: shiftStart,
          endAt: shiftEnd,
          locationReference: dto.locationReference,
          requiredHeadcount: dto.requiredHeadcount || 1,
          status: 'OPEN',
        },
      });

      createdInstances.push(instance);
      cur.setDate(cur.getDate() + 1);
    }

    return { generatedCount: createdInstances.length, instances: createdInstances };
  }

  async getShiftInstances(communityId: string, startDate?: string, endDate?: string) {
    return this.prisma.shiftInstance.findMany({
      where: {
        communityId,
        ...(startDate ? { startAt: { gte: new Date(startDate) } } : {}),
        ...(endDate ? { endAt: { lte: new Date(endDate) } } : {}),
      },
      include: {
        shiftTemplate: true,
        assignments: { include: { worker: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }
}
