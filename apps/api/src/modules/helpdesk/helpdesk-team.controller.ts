import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HelpdeskTeamService } from './helpdesk-team.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  createHelpdeskTeamSchema,
  updateHelpdeskTeamSchema,
  addHelpdeskTeamMemberSchema,
  updateHelpdeskTeamMemberSchema,
} from '@community-os/validation';
import {
  toHelpdeskTeamDto,
  toHelpdeskTeamMemberDto,
  type HelpdeskTeamResponseDto,
  type HelpdeskTeamMemberResponseDto,
} from '@community-os/contracts';

@Controller('helpdesk/teams')
@UseGuards(AuthGuard, PermissionGuard)
export class HelpdeskTeamController {
  constructor(private readonly teamService: HelpdeskTeamService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_TEAM_MANAGE)
  async createTeam(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<HelpdeskTeamResponseDto> {
    const validated = createHelpdeskTeamSchema.parse(body);
    const team = await this.teamService.createTeam(validated, actor);
    return toHelpdeskTeamDto(team);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TICKET_TEAM_VIEW)
  async listTeams(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: 'ACTIVE' | 'ARCHIVED',
  ): Promise<HelpdeskTeamResponseDto[]> {
    const teams = await this.teamService.listTeams({
      organizationId,
      communityId,
      status,
    });
    return teams.map((t) => toHelpdeskTeamDto(t, t.members));
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TICKET_TEAM_VIEW)
  async getTeam(@Param('id') id: string): Promise<HelpdeskTeamResponseDto> {
    const team = await this.teamService.getTeamById(id);
    return toHelpdeskTeamDto(team, team.members);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.TICKET_TEAM_MANAGE)
  async updateTeam(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<HelpdeskTeamResponseDto> {
    const validated = updateHelpdeskTeamSchema.parse(body);
    const updated = await this.teamService.updateTeam(id, validated, actor);
    return toHelpdeskTeamDto(updated);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.TICKET_TEAM_MANAGE)
  async archiveTeam(@Param('id') id: string): Promise<HelpdeskTeamResponseDto> {
    const archived = await this.teamService.archiveTeam(id);
    return toHelpdeskTeamDto(archived);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_TEAM_MANAGE)
  async addMember(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<HelpdeskTeamMemberResponseDto> {
    const validated = addHelpdeskTeamMemberSchema.parse(body);
    const member = await this.teamService.addMember(id, validated, actor);
    return toHelpdeskTeamMemberDto(member);
  }

  @Patch(':id/members/:userId')
  @RequirePermission(PERMISSIONS.TICKET_TEAM_MANAGE)
  async updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<HelpdeskTeamMemberResponseDto> {
    const validated = updateHelpdeskTeamMemberSchema.parse(body);
    const updated = await this.teamService.updateMember(id, userId, validated, actor);
    return toHelpdeskTeamMemberDto(updated);
  }

  @Delete(':id/members/:userId')
  @RequirePermission(PERMISSIONS.TICKET_TEAM_MANAGE)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ success: boolean }> {
    await this.teamService.removeMember(id, userId, actor);
    return { success: true };
  }
}
