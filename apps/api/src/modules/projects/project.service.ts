import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectSequenceService } from './project-sequence.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ProjectSequenceService,
  ) {}

  async createProject(dto: any, actorId?: string) {
    const projectNumber = await this.sequenceService.getNextProjectNumber(dto.organizationId);

    const project = await this.prisma.project.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        projectNumber,
        name: dto.name,
        description: dto.description,
        projectType: dto.projectType || 'CAPEX',
        classification: dto.classification || 'CAPEX',
        status: 'DRAFT',
        priority: dto.priority || 'MEDIUM',
        capexInitiativeId: dto.capexInitiativeId,
        budgetId: dto.budgetId,
        budgetLineId: dto.budgetLineId,
        fundId: dto.fundId,
        costCenterId: dto.costCenterId,
        plannedStartDate: new Date(dto.plannedStartDate),
        plannedEndDate: new Date(dto.plannedEndDate),
        approvedBudget: new Prisma.Decimal(dto.approvedBudget || 0),
        currency: dto.currency || 'INR',
        projectManagerId: dto.projectManagerId,
        createdById: actorId,
      },
    });

    // Create Initial Scope
    await this.prisma.projectScope.create({
      data: {
        projectId: project.id,
        versionNumber: 1,
        isCurrentVersion: true,
        scopeSummary: dto.scopeSummary || dto.description || dto.name,
        status: 'DRAFT',
        createdById: actorId,
      },
    });

    // Team Members
    if (dto.teamMembers && dto.teamMembers.length > 0) {
      await this.prisma.projectTeamMember.createMany({
        data: dto.teamMembers.map((m: any) => ({
          projectId: project.id,
          userId: m.userId,
          name: m.name,
          email: m.email,
          phone: m.phone,
          role: m.role || 'OTHER',
          isExternal: m.isExternal || false,
          companyName: m.companyName,
        })),
      });
    }

    // Locations
    if (dto.locations && dto.locations.length > 0) {
      await this.prisma.projectLocationLink.createMany({
        data: dto.locations.map((l: any) => ({
          projectId: project.id,
          communitySectionId: l.communitySectionId,
          buildingId: l.buildingId,
          floorId: l.floorId,
          unitId: l.unitId,
          commonAreaName: l.commonAreaName,
          description: l.description,
        })),
      });
    }

    // Initialize Financial Projection
    await this.prisma.projectFinancialSummary.create({
      data: {
        projectId: project.id,
        approvedBudget: new Prisma.Decimal(dto.approvedBudget || 0),
        availableBudget: new Prisma.Decimal(dto.approvedBudget || 0),
      },
    });

    return this.getProjectById(project.id);
  }

  async convertFromCapex(capexInitiativeId: string, actorId?: string) {
    const capex = await this.prisma.capexInitiative.findUnique({
      where: { id: capexInitiativeId },
    });
    if (!capex) throw new NotFoundException('CapexInitiative not found');

    const dto = {
      organizationId: capex.organizationId,
      communityId: capex.communityId,
      name: capex.name,
      description: capex.description || capex.businessJustification,
      projectType: 'CAPEX',
      classification: 'CAPEX',
      priority: capex.priority,
      capexInitiativeId: capex.id,
      fundId: capex.fundId,
      costCenterId: capex.costCenterId,
      budgetLineId: capex.budgetLineId,
      plannedStartDate: capex.plannedStart || new Date(),
      plannedEndDate: capex.plannedEnd || new Date(Date.now() + 180 * 24 * 3600 * 1000),
      approvedBudget: Number(capex.approvedBudget || capex.estimatedCost),
    };

    return this.createProject(dto, actorId);
  }

  async getProjects(params: { organizationId?: string; communityId?: string; status?: string }) {
    return this.prisma.project.findMany({
      where: {
        ...(params.organizationId && { organizationId: params.organizationId }),
        ...(params.communityId && { communityId: params.communityId }),
        ...(params.status && { status: params.status as any }),
      },
      include: {
        financialSummary: true,
        capexInitiative: true,
        teamMembers: true,
        locations: {
          include: { building: true, floor: true, unit: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        financialSummary: true,
        scopes: { where: { isCurrentVersion: true } },
        teamMembers: true,
        locations: {
          include: { building: true, floor: true, unit: true },
        },
        boqs: { where: { isCurrentRevision: true }, include: { lines: true } },
        workPackages: { include: { vendor: true } },
        milestones: { orderBy: { plannedDate: 'asc' } },
        progressLogs: { take: 10, orderBy: { logDate: 'desc' } },
        measurements: { take: 20, orderBy: { measurementDate: 'desc' } },
        certificates: { orderBy: { createdAt: 'desc' } },
        retentions: true,
        variations: true,
        snags: true,
        handovers: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async submitProject(id: string, _actorId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== 'DRAFT')
      throw new BadRequestException('Only DRAFT projects can be submitted');

    return this.prisma.project.update({
      where: { id },
      data: { status: 'UNDER_REVIEW' },
    });
  }

  async approveProject(id: string, _actorId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async updateProjectStatus(id: string, status: string, _actorId?: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
