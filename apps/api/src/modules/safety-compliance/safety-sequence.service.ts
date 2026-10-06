import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class SafetySequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextIncidentNumber(communityId: string, prefix = 'INC'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.safetyIncident.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.safetyIncident.findUnique({ where: { incidentNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextSOSNumber(communityId: string, prefix = 'SOS'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.emergencySOS.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.emergencySOS.findUnique({ where: { sosNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextHazardNumber(communityId: string, prefix = 'HAZ'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.safetyHazard.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.safetyHazard.findUnique({ where: { hazardNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextRiskNumber(communityId: string, prefix = 'RSK'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.safetyRisk.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.safetyRisk.findUnique({ where: { riskNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextInspectionNumber(communityId: string, prefix = 'INSP'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.safetyInspection.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (
      await this.prisma.safetyInspection.findUnique({ where: { inspectionNumber: candidate } })
    ) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextDrillNumber(communityId: string, prefix = 'DRL'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.safetyDrill.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.safetyDrill.findUnique({ where: { drillNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextPermitNumber(communityId: string, prefix = 'PTW'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.safetyPermitToWork.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (
      await this.prisma.safetyPermitToWork.findUnique({ where: { permitNumber: candidate } })
    ) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }
}
