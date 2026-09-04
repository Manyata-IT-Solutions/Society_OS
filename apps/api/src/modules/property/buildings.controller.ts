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
  createBuildingSchema,
  updateBuildingSchema,
  buildingQuerySchema,
} from '@community-os/validation';
import { toBuildingResponseDto, type BuildingResponseDto } from '@community-os/contracts';

@ApiTags('Property - Buildings')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class BuildingsController {
  constructor(private readonly buildingService: BuildingService) {}

  @Post('communities/:communityId/buildings')
  @RequirePermission(PERMISSIONS.BUILDING_CREATE, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Create a new building/tower/wing in a community' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Building created' })
  async create(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
  ): Promise<BuildingResponseDto> {
    const validated = createBuildingSchema.parse(body);
    const building = await this.buildingService.createBuilding(communityId, validated);
    return toBuildingResponseDto(building);
  }

  @Get('communities/:communityId/buildings')
  @RequirePermission(PERMISSIONS.BUILDING_VIEW, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'List buildings in a community' })
  async findMany(
    @Param('communityId') communityId: string,
    @Query() query: unknown,
  ): Promise<{ items: BuildingResponseDto[]; total: number }> {
    const validated = buildingQuerySchema.parse(query);
    const result = await this.buildingService.findBuildings(communityId, validated);
    return {
      items: result.items.map((b) => toBuildingResponseDto(b)),
      total: result.total,
    };
  }

  @Get('buildings/:buildingId')
  @RequirePermission(PERMISSIONS.BUILDING_VIEW)
  @ApiOperation({ summary: 'Get building details by ID' })
  async findById(@Param('buildingId') buildingId: string): Promise<BuildingResponseDto> {
    const building = await this.buildingService.findBuildingById(buildingId);
    return toBuildingResponseDto(building);
  }

  @Patch('buildings/:buildingId')
  @RequirePermission(PERMISSIONS.BUILDING_UPDATE)
  @ApiOperation({ summary: 'Update building properties and status' })
  async update(
    @Param('buildingId') buildingId: string,
    @Body() body: unknown,
  ): Promise<BuildingResponseDto> {
    const validated = updateBuildingSchema.parse(body);
    const updated = await this.buildingService.updateBuilding(buildingId, validated);
    return toBuildingResponseDto(updated);
  }
}
