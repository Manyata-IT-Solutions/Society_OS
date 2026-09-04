import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateDepartmentDto,
  CreateJobRoleDto,
  CreateSkillDto,
  AssignWorkerSkillDto,
  CreateWorkerCertificationDto,
} from '@community-os/contracts';

@Injectable()
export class WorkforceStructureService {
  constructor(private readonly prisma: PrismaService) {}

  async createDepartment(dto: CreateDepartmentDto) {
    const existing = await this.prisma.workforceDepartment.findFirst({
      where: { organizationId: dto.organizationId, code: dto.code },
    });
    if (existing) throw new ConflictException('Department code already exists');

    return this.prisma.workforceDepartment.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        communityId: dto.communityId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        parentDepartment: dto.parentDepartmentId
          ? { connect: { id: dto.parentDepartmentId } }
          : undefined,
      },
    });
  }

  async getDepartments(organizationId: string) {
    return this.prisma.workforceDepartment.findMany({
      where: { organizationId },
      include: { childDepartments: true, jobRoles: true },
      orderBy: { code: 'asc' },
    });
  }

  async createJobRole(dto: CreateJobRoleDto) {
    return this.prisma.workforceJobRole.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        trade: dto.trade,
      },
    });
  }

  async getJobRoles(organizationId: string) {
    return this.prisma.workforceJobRole.findMany({
      where: { organizationId },
      include: { department: true },
      orderBy: { code: 'asc' },
    });
  }

  async createSkill(dto: CreateSkillDto) {
    return this.prisma.workforceSkill.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        code: dto.code,
        name: dto.name,
        category: dto.category,
        description: dto.description,
      },
    });
  }

  async getSkills(organizationId: string) {
    return this.prisma.workforceSkill.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
    });
  }

  async assignWorkerSkill(dto: AssignWorkerSkillDto, verifierUserId?: string) {
    return this.prisma.workerSkill.upsert({
      where: { workerId_skillId: { workerId: dto.workerId, skillId: dto.skillId } },
      update: {
        proficiencyLevel: dto.proficiencyLevel || 'INTERMEDIATE',
        verified: dto.verified ?? true,
        verifiedById: verifierUserId,
      },
      create: {
        worker: { connect: { id: dto.workerId } },
        skill: { connect: { id: dto.skillId } },
        proficiencyLevel: dto.proficiencyLevel || 'INTERMEDIATE',
        verified: dto.verified ?? true,
        verifiedBy: verifierUserId ? { connect: { id: verifierUserId } } : undefined,
      },
    });
  }

  async createCertification(dto: CreateWorkerCertificationDto) {
    return this.prisma.workerCertification.create({
      data: {
        worker: { connect: { id: dto.workerId } },
        name: dto.name,
        certificationType: dto.certificationType,
        certificateNumber: dto.certificateNumber,
        issuedBy: dto.issuedBy,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        document: dto.documentId ? { connect: { id: dto.documentId } } : undefined,
        verificationStatus: 'VERIFIED',
      },
    });
  }
}
