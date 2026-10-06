import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SlaService } from './sla.service.js';
import { SlaSweeperService } from './sla-sweeper.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateSlaPolicySchema } from '@community-os/validation';
import {
  toSlaPolicyDto,
  toSlaInstanceDto,
  type SlaPolicyResponseDto,
  type SlaInstanceResponseDto,
} from '@community-os/contracts';

@Controller('sla')
@UseGuards(AuthGuard, PermissionGuard)
export class SlaController {
  constructor(
    private readonly slaService: SlaService,
    private readonly sweeperService: SlaSweeperService,
  ) {}

  @Get('policies')
  @RequirePermission(PERMISSIONS.SLA_POLICY_VIEW)
  async listPolicies(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: SlaPolicyResponseDto[]; total: number }> {
    const res = await this.slaService.listPolicies({
      organizationId,
      communityId,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: res.items.map(toSlaPolicyDto),
      total: res.total,
    };
  }

  @Get('policies/:id')
  @RequirePermission(PERMISSIONS.SLA_POLICY_VIEW)
  async getPolicy(@Param('id') id: string): Promise<SlaPolicyResponseDto> {
    const policy = await this.slaService.getPolicyById(id);
    return toSlaPolicyDto(policy);
  }

  @Post('policies')
  @RequirePermission(PERMISSIONS.SLA_POLICY_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createPolicy(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<SlaPolicyResponseDto> {
    const parsed = CreateSlaPolicySchema.parse(body);
    const created = await this.slaService.createPolicyDraft(
      parsed as unknown as Parameters<typeof this.slaService.createPolicyDraft>[0],
      actor,
    );
    return toSlaPolicyDto(created);
  }

  @Post('policies/:id/publish')
  @RequirePermission(PERMISSIONS.SLA_POLICY_MANAGE)
  @HttpCode(HttpStatus.OK)
  async publishPolicy(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<SlaPolicyResponseDto> {
    const published = await this.slaService.publishPolicy(id, actor);
    return toSlaPolicyDto(published);
  }

  @Post('policies/:id/clone')
  @RequirePermission(PERMISSIONS.SLA_POLICY_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async clonePolicy(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<SlaPolicyResponseDto> {
    const cloned = await this.slaService.clonePolicyVersion(id, actor);
    return toSlaPolicyDto(cloned);
  }

  @Get('instances')
  @RequirePermission(PERMISSIONS.SLA_INSTANCE_VIEW)
  async listInstances(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('workflowInstanceId') workflowInstanceId?: string,
    @Query('status') status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BREACHED' | 'CANCELLED',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: SlaInstanceResponseDto[]; total: number }> {
    const res = await this.slaService.listInstances({
      organizationId,
      communityId,
      resourceType,
      resourceId,
      workflowInstanceId,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: res.items.map(toSlaInstanceDto),
      total: res.total,
    };
  }

  @Post('reconcile')
  @RequirePermission(PERMISSIONS.SLA_OVERRIDE)
  @HttpCode(HttpStatus.OK)
  async reconcileSweeper(): Promise<{ warningsProcessed: number; breachesProcessed: number }> {
    return this.sweeperService.sweep();
  }
}
