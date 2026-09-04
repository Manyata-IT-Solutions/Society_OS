import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateCommitteeDto,
  CreateCommitteeTermDto,
  CreateCommitteePositionDto,
  AssignCommitteeMemberDto,
} from '@community-os/contracts';

@Injectable()
export class CommitteeMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async createCommittee(dto: CreateCommitteeDto) {
    const existing = await this.prisma.governanceCommittee.findUnique({
      where: {
        communityId_code: {
          communityId: dto.communityId,
          code: dto.code,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Committee with code ${dto.code} already exists in this community`,
      );
    }

    const committee = await this.prisma.governanceCommittee.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        committeeType: dto.committeeType || 'MANAGING',
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      },
      include: { terms: true },
    });

    return committee;
  }

  async listCommittees(communityId: string) {
    return this.prisma.governanceCommittee.findMany({
      where: { communityId },
      include: {
        terms: {
          include: {
            memberships: {
              include: { position: true, resident: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCommitteeById(id: string) {
    const committee = await this.prisma.governanceCommittee.findUnique({
      where: { id },
      include: {
        terms: {
          include: {
            memberships: {
              include: { position: true, resident: true, user: true },
            },
          },
        },
      },
    });
    if (!committee) {
      throw new NotFoundException(`Committee with ID ${id} not found`);
    }
    return committee;
  }

  async createTerm(dto: CreateCommitteeTermDto) {
    const term = await this.prisma.committeeTerm.create({
      data: {
        committeeId: dto.committeeId,
        termNumber: dto.termNumber,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        electionReference: dto.electionReference,
        notes: dto.notes,
        status: 'ACTIVE',
      },
    });
    return term;
  }

  async createPosition(dto: CreateCommitteePositionDto) {
    return this.prisma.committeePosition.create({
      data: {
        organizationId: dto.organizationId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        isExecutive: dto.isExecutive || false,
      },
    });
  }

  async listPositions(organizationId: string) {
    return this.prisma.committeePosition.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
    });
  }

  async assignMember(dto: AssignCommitteeMemberDto) {
    const membership = await this.prisma.committeeMembership.create({
      data: {
        committeeTermId: dto.committeeTermId,
        positionId: dto.positionId,
        personReferenceType: dto.personReferenceType || 'RESIDENT',
        residentId: dto.residentId,
        userId: dto.userId,
        externalPersonName: dto.externalPersonName,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        appointmentMethod: dto.appointmentMethod || 'ELECTED',
        appointmentReference: dto.appointmentReference,
        status: 'ACTIVE',
      },
      include: { position: true, resident: true },
    });

    return membership;
  }
}
