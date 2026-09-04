import { Injectable, HttpStatus } from '@nestjs/common';
import { HelpdeskTeamRepository, type TeamWithMembers } from './helpdesk-team.repository.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  CreateHelpdeskTeamInput,
  UpdateHelpdeskTeamInput,
  AddHelpdeskTeamMemberInput,
  UpdateHelpdeskTeamMemberInput,
} from '@community-os/validation';
import type { HelpdeskTeam, HelpdeskTeamMember, Actor } from '@community-os/types';

@Injectable()
export class HelpdeskTeamService {
  constructor(private readonly teamRepo: HelpdeskTeamRepository) {}

  async createTeam(input: CreateHelpdeskTeamInput, actor?: Actor): Promise<HelpdeskTeam> {
    const existing = await this.teamRepo.findTeamByKey(
      input.organizationId,
      input.communityId ?? null,
      input.key,
    );
    if (existing) {
      throw new DomainException(
        'TEAM_KEY_ALREADY_EXISTS',
        `Helpdesk team with key "${input.key}" already exists in this scope.`,
        HttpStatus.CONFLICT,
      );
    }

    return this.teamRepo.createTeam({
      organizationId: input.organizationId,
      communityId: input.communityId ?? null,
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      createdById: actor?.id ?? null,
    });
  }

  async updateTeam(
    id: string,
    input: UpdateHelpdeskTeamInput,
    _actor?: Actor,
  ): Promise<HelpdeskTeam> {
    const existing = await this.teamRepo.findTeamById(id);
    if (!existing) {
      throw new DomainException(
        'TEAM_NOT_FOUND',
        `Helpdesk team with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.teamRepo.updateTeam(id, { ...input });
  }

  async getTeamById(id: string): Promise<TeamWithMembers> {
    const team = await this.teamRepo.findTeamById(id);
    if (!team) {
      throw new DomainException(
        'TEAM_NOT_FOUND',
        `Helpdesk team with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return team;
  }

  async listTeams(filters: {
    organizationId?: string;
    communityId?: string | null;
    status?: 'ACTIVE' | 'ARCHIVED';
  }): Promise<TeamWithMembers[]> {
    return this.teamRepo.findTeams(filters);
  }

  async archiveTeam(id: string): Promise<HelpdeskTeam> {
    const existing = await this.teamRepo.findTeamById(id);
    if (!existing) {
      throw new DomainException(
        'TEAM_NOT_FOUND',
        `Helpdesk team with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.teamRepo.archiveTeam(id);
  }

  async addMember(
    teamId: string,
    input: AddHelpdeskTeamMemberInput,
    _actor?: Actor,
  ): Promise<HelpdeskTeamMember> {
    const team = await this.teamRepo.findTeamById(teamId);
    if (!team) {
      throw new DomainException(
        'TEAM_NOT_FOUND',
        `Helpdesk team with id "${teamId}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.teamRepo.addMember({
      teamId,
      userId: input.userId,
      roleInTeam: input.roleInTeam,
      isActive: input.isActive,
    });
  }

  async updateMember(
    teamId: string,
    userId: string,
    input: UpdateHelpdeskTeamMemberInput,
    _actor?: Actor,
  ): Promise<HelpdeskTeamMember> {
    const team = await this.teamRepo.findTeamById(teamId);
    if (!team) {
      throw new DomainException(
        'TEAM_NOT_FOUND',
        `Helpdesk team with id "${teamId}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.teamRepo.updateMember(teamId, userId, input);
  }

  async removeMember(teamId: string, userId: string, _actor?: Actor): Promise<void> {
    const team = await this.teamRepo.findTeamById(teamId);
    if (!team) {
      throw new DomainException(
        'TEAM_NOT_FOUND',
        `Helpdesk team with id "${teamId}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.teamRepo.removeMember(teamId, userId);
  }

  async getUserTeamIds(userId: string): Promise<string[]> {
    return this.teamRepo.getUserTeams(userId);
  }
}
