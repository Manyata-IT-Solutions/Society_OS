import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MaintenancePlanService } from './maintenance-plan.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, MaintenancePlanStatus } from '@community-os/types';
import { createMaintenancePlanSchema, updateMaintenancePlanSchema } from '@community-os/validation';
import { toMaintenancePlanDto, MaintenancePlanResponseDto } from '@community-os/contracts';

@Controller('facility/maintenance-plans')
@UseGuards(AuthGuard, PermissionGuard)
export class MaintenancePlanController {
  constructor(private readonly planService: MaintenancePlanService) {}

  @Post()
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<MaintenancePlanResponseDto> {
    const parsed = createMaintenancePlanSchema.parse(body);
    const plan = await this.planService.createPlan(
      {
        ...parsed,
        organizationId: (body as Record<string, unknown>).organizationId as string,
        communityId:
          ((body as Record<string, unknown>).communityId as string) ||
          (parsed as any).communityId ||
          '',
      },
      actor,
    );
    return toMaintenancePlanDto(plan, {
      workCategoryName: plan.workCategory?.name,
      defaultTeamName: plan.defaultTeam?.name,
      checklistTemplateName: plan.checklistTemplate?.name,
      targetBuildingName: plan.targetBuilding?.name,
      targetUnitNumber: plan.targetUnit?.unitNumber,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_VIEW)
  async listPlans(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: MaintenancePlanStatus,
    @Query('workCategoryId') workCategoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    items: MaintenancePlanResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.planService.listPlans({
      organizationId,
      communityId,
      status,
      workCategoryId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return {
      items: result.items.map((p) =>
        toMaintenancePlanDto(p, {
          workCategoryName: p.workCategory?.name,
          defaultTeamName: p.defaultTeam?.name,
          checklistTemplateName: p.checklistTemplate?.name,
          targetBuildingName: p.targetBuilding?.name,
          targetUnitNumber: p.targetUnit?.unitNumber,
        }),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_VIEW)
  async getPlan(@Param('id') id: string): Promise<MaintenancePlanResponseDto> {
    const plan = await this.planService.getPlanById(id);
    return toMaintenancePlanDto(plan, {
      workCategoryName: plan.workCategory?.name,
      defaultTeamName: plan.defaultTeam?.name,
      checklistTemplateName: plan.checklistTemplate?.name,
      targetBuildingName: plan.targetBuilding?.name,
      targetUnitNumber: plan.targetUnit?.unitNumber,
    });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_UPDATE)
  async updatePlan(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<MaintenancePlanResponseDto> {
    const parsed = updateMaintenancePlanSchema.parse(body);
    const plan = await this.planService.updatePlan(id, parsed, actor);
    return toMaintenancePlanDto(plan, {
      workCategoryName: plan.workCategory?.name,
      defaultTeamName: plan.defaultTeam?.name,
      checklistTemplateName: plan.checklistTemplate?.name,
      targetBuildingName: plan.targetBuilding?.name,
      targetUnitNumber: plan.targetUnit?.unitNumber,
    });
  }

  @Post(':id/activate')
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_ACTIVATE)
  @HttpCode(HttpStatus.OK)
  async activatePlan(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<MaintenancePlanResponseDto> {
    const plan = await this.planService.activatePlan(id, actor);
    return toMaintenancePlanDto(plan);
  }

  @Post(':id/pause')
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_PAUSE)
  @HttpCode(HttpStatus.OK)
  async pausePlan(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<MaintenancePlanResponseDto> {
    const plan = await this.planService.pausePlan(id, actor);
    return toMaintenancePlanDto(plan);
  }

  @Post(':id/archive')
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_ARCHIVE)
  @HttpCode(HttpStatus.OK)
  async archivePlan(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<MaintenancePlanResponseDto> {
    const plan = await this.planService.archivePlan(id, actor);
    return toMaintenancePlanDto(plan);
  }

  @Post(':id/preview')
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_VIEW)
  @HttpCode(HttpStatus.OK)
  async previewSchedule(
    @Param('id') id: string,
    @Body() body: { count?: number },
  ): Promise<string[]> {
    const plan = await this.planService.getPlanById(id);
    return this.planService.previewNextOccurrences(
      plan.scheduleType,
      plan.scheduleDefinition as any,
      body.count ?? 10,
      plan.timezone,
    );
  }

  @Post(':id/generate')
  @RequirePermission(PERMISSIONS.MAINTENANCE_PLAN_GENERATE)
  @HttpCode(HttpStatus.OK)
  async generateOccurrence(
    @Param('id') id: string,
    @Body() body: { occurrenceDate?: string },
    @CurrentActor() actor: Actor,
  ): Promise<unknown> {
    const occurrenceDate = body.occurrenceDate ? new Date(body.occurrenceDate) : new Date();
    return this.planService.generateOccurrence(id, occurrenceDate, true, actor);
  }
}
