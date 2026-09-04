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
import { FacilityCategoryService } from './facility-category.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, EntityStatus } from '@community-os/types';
import {
  createFacilityWorkCategorySchema,
  updateFacilityWorkCategorySchema,
} from '@community-os/validation';
import {
  toFacilityWorkCategoryDto,
  FacilityWorkCategoryResponseDto,
} from '@community-os/contracts';

@Controller('facility/categories')
@UseGuards(AuthGuard, PermissionGuard)
export class FacilityCategoryController {
  constructor(private readonly categoryService: FacilityCategoryService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FACILITY_CATEGORY_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<FacilityWorkCategoryResponseDto> {
    const parsed = createFacilityWorkCategorySchema.parse(body);
    const category = await this.categoryService.createCategory(
      {
        ...parsed,
        organizationId: (body as Record<string, unknown>).organizationId as string,
        communityId: (body as Record<string, unknown>).communityId as string | undefined,
      },
      actor,
    );
    return toFacilityWorkCategoryDto(category, {
      defaultTeamName: category.defaultTeam?.name,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.FACILITY_CATEGORY_VIEW)
  async listCategories(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: EntityStatus,
  ): Promise<FacilityWorkCategoryResponseDto[]> {
    const categories = await this.categoryService.listCategories({
      organizationId,
      communityId,
      status,
    });
    return categories.map((c) =>
      toFacilityWorkCategoryDto(c, {
        defaultTeamName: c.defaultTeam?.name,
      }),
    );
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FACILITY_CATEGORY_VIEW)
  async getCategory(@Param('id') id: string): Promise<FacilityWorkCategoryResponseDto> {
    const category = await this.categoryService.getCategoryById(id);
    return toFacilityWorkCategoryDto(category, {
      defaultTeamName: category.defaultTeam?.name,
    });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.FACILITY_CATEGORY_MANAGE)
  async updateCategory(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<FacilityWorkCategoryResponseDto> {
    const parsed = updateFacilityWorkCategorySchema.parse(body);
    const category = await this.categoryService.updateCategory(id, parsed, actor);
    return toFacilityWorkCategoryDto(category, {
      defaultTeamName: category.defaultTeam?.name,
    });
  }
}
