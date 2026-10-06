import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, HelpdeskTeamStatus } from '@prisma/client';
import type { HelpdeskTeam, HelpdeskTeamMember } from '@community-os/types';

export type TeamWithMembers = HelpdeskTeam & {
  members: Array<HelpdeskTeamMember & { user?: { name?: string; email?: string } }>;
};

@Injectable()
export class HelpdeskTeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(data: Prisma.HelpdeskTeamUncheckedCreateInput): Promise<HelpdeskTeam> {
    const record = await this.prisma.helpdeskTeam.create({ data });
    return this.mapToDomain(record);
  }

  async findTeamById(id: string): Promise<TeamWithMembers | null> {
    const record = await this.prisma.helpdeskTeam.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!record) return null;
    return {
      ...this.mapToDomain(record),
      members: record.members.map((m) => ({
        id: m.id,
        teamId: m.teamId,
        userId: m.userId,
        roleInTeam: m.roleInTeam,
        isActive: m.isActive,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        user: {
          name: m.user.displayName,
          email: m.user.email,
        },
      })),
    };
  }

  async findTeamByKey(
    organizationId: string,
    communityId: string | null,
    key: string,
  ): Promise<HelpdeskTeam | null> {
    const record = await this.prisma.helpdeskTeam.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        key,
      },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findTeams(filters: {
    organizationId?: string;
    communityId?: string | null;
    status?: HelpdeskTeamStatus;
  }): Promise<TeamWithMembers[]> {
    const where: Prisma.HelpdeskTeamWhereInput = {};
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.communityId !== undefined) {
      where.OR = [{ communityId: filters.communityId }, { communityId: null }];
    }
    if (filters.status) where.status = filters.status;

    const records = await this.prisma.helpdeskTeam.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return records.map((r) => ({
      ...this.mapToDomain(r),
      members: r.members.map((m) => ({
        id: m.id,
        teamId: m.teamId,
        userId: m.userId,
        roleInTeam: m.roleInTeam,
        isActive: m.isActive,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        user: {
          name: m.user.displayName,
          email: m.user.email,
        },
      })),
    }));
  }

  async updateTeam(
    id: string,
    data: Prisma.HelpdeskTeamUncheckedUpdateInput,
  ): Promise<HelpdeskTeam> {
    const record = await this.prisma.helpdeskTeam.update({
      where: { id },
      data,
    });
    return this.mapToDomain(record);
  }

  async archiveTeam(id: string): Promise<HelpdeskTeam> {
    const record = await this.prisma.helpdeskTeam.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return this.mapToDomain(record);
  }

  async addMember(data: {
    teamId: string;
    userId: string;
    roleInTeam?: string | null;
    isActive?: boolean;
  }): Promise<HelpdeskTeamMember> {
    const record = await this.prisma.helpdeskTeamMember.upsert({
      where: {
        teamId_userId: {
          teamId: data.teamId,
          userId: data.userId,
        },
      },
      update: {
        roleInTeam: data.roleInTeam,
        isActive: data.isActive ?? true,
      },
      create: {
        teamId: data.teamId,
        userId: data.userId,
        roleInTeam: data.roleInTeam ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return {
      id: record.id,
      teamId: record.teamId,
      userId: record.userId,
      roleInTeam: record.roleInTeam,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateMember(
    teamId: string,
    userId: string,
    data: { roleInTeam?: string | null; isActive?: boolean },
  ): Promise<HelpdeskTeamMember> {
    const record = await this.prisma.helpdeskTeamMember.update({
      where: {
        teamId_userId: { teamId, userId },
      },
      data,
    });
    return {
      id: record.id,
      teamId: record.teamId,
      userId: record.userId,
      roleInTeam: record.roleInTeam,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.prisma.helpdeskTeamMember.deleteMany({
      where: { teamId, userId },
    });
  }

  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.helpdeskTeamMember.count({
      where: { teamId, userId, isActive: true },
    });
    return count > 0;
  }

  async getUserTeams(userId: string): Promise<string[]> {
    const memberships = await this.prisma.helpdeskTeamMember.findMany({
      where: { userId, isActive: true },
      select: { teamId: true },
    });
    return memberships.map((m) => m.teamId);
  }

  private mapToDomain(record: {
    id: string;
    organizationId: string;
    communityId: string | null;
    key: string;
    name: string;
    description: string | null;
    status: HelpdeskTeamStatus;
    createdById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): HelpdeskTeam {
    return {
      id: record.id,
      organizationId: record.organizationId,
      communityId: record.communityId,
      key: record.key,
      name: record.name,
      description: record.description,
      status: record.status as HelpdeskTeam['status'],
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
