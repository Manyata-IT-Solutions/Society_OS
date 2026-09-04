import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResidentService } from './resident.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  createResidentSchema,
  updateResidentSchema,
  residentQuerySchema,
  linkResidentUserSchema,
} from '@community-os/validation';
import {
  toResidentSummaryDto,
  toResidentDetailDto,
  type ResidentSummaryDto,
  type ResidentDetailDto,
} from '@community-os/contracts';

@ApiTags('Residents - Master')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class ResidentsController {
  constructor(
    private readonly residentService: ResidentService,
    private readonly authService: AuthorizationService,
  ) {}

  @Post('communities/:communityId/residents')
  @RequirePermission(PERMISSIONS.RESIDENT_CREATE, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Create a new residential profile in community' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Resident created' })
  async createResident(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
  ): Promise<ResidentDetailDto> {
    const validated = createResidentSchema.parse(body);
    const resident = await this.residentService.createResident(communityId, validated);
    return toResidentDetailDto(resident, true);
  }

  @Get('communities/:communityId/residents')
  @RequirePermission(PERMISSIONS.RESIDENT_VIEW, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'List and search residents in community' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of residents' })
  async listResidents(
    @Param('communityId') communityId: string,
    @Query() query: unknown,
  ): Promise<{ items: ResidentSummaryDto[]; total: number }> {
    const validated = residentQuerySchema.parse(query);
    const result = await this.residentService.listResidents(communityId, validated);
    return {
      items: result.items.map((r) => toResidentSummaryDto(r)),
      total: result.total,
    };
  }

  @Get('residents/:id')
  @ApiOperation({ summary: 'Get detailed resident profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resident details' })
  async getResident(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<ResidentDetailDto> {
    const resident = await this.residentService.findResidentById(id);

    // Evaluate if actor can view confidential contact info
    const canViewContact =
      actor.isPlatformAdmin ||
      (resident.userId && resident.userId === actor.id) ||
      (await this.authService.can(actor, PERMISSIONS.RESIDENT_CONTACT_VIEW, {
        scopeType: 'COMMUNITY',
        scopeId: resident.communityId,
      }));

    return toResidentDetailDto(resident, Boolean(canViewContact));
  }

  @Patch('residents/:id')
  @ApiOperation({ summary: 'Update resident profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resident updated' })
  async updateResident(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<ResidentDetailDto> {
    const resident = await this.residentService.findResidentById(id);

    // If updating own profile vs administrative update
    const isSelf = resident.userId && resident.userId === actor.id;
    if (!isSelf) {
      await this.authService.enforce(actor, PERMISSIONS.RESIDENT_UPDATE, {
        scopeType: 'COMMUNITY',
        scopeId: resident.communityId,
      });
    }

    const validated = updateResidentSchema.parse(body);
    const updated = await this.residentService.updateResident(id, validated);
    return toResidentDetailDto(updated, true);
  }

  @Post('residents/:id/invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invite resident and provision User authentication account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resident invited' })
  async inviteResident(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ resident: ResidentDetailDto; user: { id: string; email: string } }> {
    const existing = await this.residentService.findResidentById(id);
    await this.authService.enforce(actor, PERMISSIONS.RESIDENT_INVITE, {
      scopeType: 'COMMUNITY',
      scopeId: existing.communityId,
    });

    const result = await this.residentService.inviteResident(id);
    return {
      resident: toResidentDetailDto(result.resident, true),
      user: result.user,
    };
  }

  @Post('residents/:id/link-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link resident profile to existing User account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resident linked to user' })
  async linkUser(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<ResidentDetailDto> {
    const existing = await this.residentService.findResidentById(id);
    await this.authService.enforce(actor, PERMISSIONS.RESIDENT_LINK_USER, {
      scopeType: 'COMMUNITY',
      scopeId: existing.communityId,
    });

    const validated = linkResidentUserSchema.parse(body);
    const updated = await this.residentService.linkUser(id, validated.userId);
    return toResidentDetailDto(updated, true);
  }

  @Delete('residents/:id')
  @ApiOperation({ summary: 'Archive a resident profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resident archived' })
  async archiveResident(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<ResidentDetailDto> {
    const existing = await this.residentService.findResidentById(id);
    await this.authService.enforce(actor, PERMISSIONS.RESIDENT_ARCHIVE, {
      scopeType: 'COMMUNITY',
      scopeId: existing.communityId,
    });

    const archived = await this.residentService.archiveResident(id);
    return toResidentDetailDto(archived, false);
  }
}
