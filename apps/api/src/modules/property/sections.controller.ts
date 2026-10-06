import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BuildingService } from './building.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import {
  createSectionSchema,
  updateSectionSchema,
  sectionQuerySchema,
} from '@community-os/validation';
import { toSectionResponseDto, type SectionResponseDto } from '@community-os/contracts';

@ApiTags('Property - Sections')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class SectionsController {
  constructor(private readonly buildingService: BuildingService) {}

  @Post('communities/:communityId/sections')
  @RequirePermission(PERMISSIONS.PROPERTY_SECTION_CREATE, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Create a new property section/phase/cluster in a community' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Section created' })
  async create(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
  ): Promise<SectionResponseDto> {
    const validated = createSectionSchema.parse(body);
    const section = await this.buildingService.createSection(communityId, validated);
    return toSectionResponseDto(section);
  }

  @Get('communities/:communityId/sections')
  @RequirePermission(PERMISSIONS.PROPERTY_SECTION_VIEW, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'List sections in a community' })
  async findMany(
    @Param('communityId') communityId: string,
    @Query() query: unknown,
  ): Promise<{ items: SectionResponseDto[]; total: number }> {
    const validated = sectionQuerySchema.parse(query);
    const result = await this.buildingService.findSections(communityId, validated);
    return {
      items: result.items.map((s) => toSectionResponseDto(s)),
      total: result.total,
    };
  }

  @Get('sections/:sectionId')
  @RequirePermission(PERMISSIONS.PROPERTY_SECTION_VIEW)
  @ApiOperation({ summary: 'Get section details by ID' })
  async findById(@Param('sectionId') sectionId: string): Promise<SectionResponseDto> {
    const section = await this.buildingService.findSectionById(sectionId);
    return toSectionResponseDto(section);
  }

  @Patch('sections/:sectionId')
  @RequirePermission(PERMISSIONS.PROPERTY_SECTION_UPDATE)
  @ApiOperation({ summary: 'Update section metadata' })
  async update(
    @Param('sectionId') sectionId: string,
    @Body() body: unknown,
  ): Promise<SectionResponseDto> {
    const validated = updateSectionSchema.parse(body);
    const updated = await this.buildingService.updateSection(sectionId, validated);
    return toSectionResponseDto(updated);
  }
}
