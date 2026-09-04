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
import { TicketCategoryService } from './ticket-category.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { createTicketCategorySchema, updateTicketCategorySchema } from '@community-os/validation';
import { toTicketCategoryDto, type TicketCategoryResponseDto } from '@community-os/contracts';

@Controller('helpdesk/categories')
@UseGuards(AuthGuard, PermissionGuard)
export class TicketCategoryController {
  constructor(private readonly categoryService: TicketCategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_CATEGORY_MANAGE)
  async createCategory(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketCategoryResponseDto> {
    const validated = createTicketCategorySchema.parse(body);
    const category = await this.categoryService.createCategory(validated, actor);
    return toTicketCategoryDto(category);
  }

  @Get('tree')
  @RequirePermission(PERMISSIONS.TICKET_CATEGORY_VIEW)
  async getCategoryTree(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('residentVisible') residentVisible?: string,
  ): Promise<TicketCategoryResponseDto[]> {
    const isResidentVisible =
      residentVisible !== undefined ? residentVisible === 'true' : undefined;
    const tree = await this.categoryService.getCategoryTree(
      organizationId,
      communityId,
      isResidentVisible,
    );
    return tree.map((c) => toTicketCategoryDto(c, c.subcategories));
  }

  @Get()
  @RequirePermission(PERMISSIONS.TICKET_CATEGORY_VIEW)
  async listCategories(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('residentVisible') residentVisible?: string,
    @Query('status') status?: 'ACTIVE' | 'ARCHIVED',
    @Query('parentId') parentId?: string,
  ): Promise<TicketCategoryResponseDto[]> {
    const categories = await this.categoryService.listCategories({
      organizationId,
      communityId,
      residentVisible: residentVisible !== undefined ? residentVisible === 'true' : undefined,
      status,
      parentId,
    });
    return categories.map((c) => toTicketCategoryDto(c));
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TICKET_CATEGORY_VIEW)
  async getCategory(@Param('id') id: string): Promise<TicketCategoryResponseDto> {
    const category = await this.categoryService.getCategoryById(id);
    return toTicketCategoryDto(category, category.subcategories);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.TICKET_CATEGORY_MANAGE)
  async updateCategory(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketCategoryResponseDto> {
    const validated = updateTicketCategorySchema.parse(body);
    const updated = await this.categoryService.updateCategory(id, validated, actor);
    return toTicketCategoryDto(updated);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.TICKET_CATEGORY_MANAGE)
  async archiveCategory(@Param('id') id: string): Promise<TicketCategoryResponseDto> {
    const archived = await this.categoryService.archiveCategory(id);
    return toTicketCategoryDto(archived);
  }
}
