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
import { ChecklistTemplateService } from './checklist-template.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, FacilityChecklistTemplateStatus } from '@community-os/types';
import {
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
} from '@community-os/validation';
import {
  toFacilityChecklistTemplateDto,
  FacilityChecklistTemplateResponseDto,
} from '@community-os/contracts';

@Controller('facility/checklists')
@UseGuards(AuthGuard, PermissionGuard)
export class ChecklistTemplateController {
  constructor(private readonly checklistService: ChecklistTemplateService) {}

  @Post()
  @RequirePermission(PERMISSIONS.CHECKLIST_TEMPLATE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<FacilityChecklistTemplateResponseDto> {
    const parsed = createChecklistTemplateSchema.parse(body);
    const template = await this.checklistService.createTemplate(
      {
        ...parsed,
        organizationId: (body as Record<string, unknown>).organizationId as string,
        communityId: (body as Record<string, unknown>).communityId as string | undefined,
      },
      actor,
    );
    return toFacilityChecklistTemplateDto(template, {
      categoryName: template.category?.name,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.CHECKLIST_TEMPLATE_VIEW)
  async listTemplates(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: FacilityChecklistTemplateStatus,
    @Query('categoryId') categoryId?: string,
  ): Promise<FacilityChecklistTemplateResponseDto[]> {
    const templates = await this.checklistService.listTemplates({
      organizationId,
      communityId,
      status,
      categoryId,
    });
    return templates.map((t) =>
      toFacilityChecklistTemplateDto(t, {
        categoryName: t.category?.name,
      }),
    );
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.CHECKLIST_TEMPLATE_VIEW)
  async getTemplate(@Param('id') id: string): Promise<FacilityChecklistTemplateResponseDto> {
    const template = await this.checklistService.getTemplateById(id);
    return toFacilityChecklistTemplateDto(template, {
      categoryName: template.category?.name,
    });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.CHECKLIST_TEMPLATE_MANAGE)
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<FacilityChecklistTemplateResponseDto> {
    const parsed = updateChecklistTemplateSchema.parse(body);
    const template = await this.checklistService.updateTemplate(id, parsed, actor);
    return toFacilityChecklistTemplateDto(template, {
      categoryName: template.category?.name,
    });
  }
}
