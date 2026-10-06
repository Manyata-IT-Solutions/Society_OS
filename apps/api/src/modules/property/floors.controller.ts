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
import { createFloorSchema, updateFloorSchema, floorQuerySchema } from '@community-os/validation';
import { toFloorResponseDto, type FloorResponseDto } from '@community-os/contracts';

@ApiTags('Property - Floors')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class FloorsController {
  constructor(private readonly buildingService: BuildingService) {}

  @Post('buildings/:buildingId/floors')
  @RequirePermission(PERMISSIONS.FLOOR_CREATE)
  @ApiOperation({ summary: 'Create a new floor in a building' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Floor created' })
  async create(
    @Param('buildingId') buildingId: string,
    @Body() body: unknown,
  ): Promise<FloorResponseDto> {
    const validated = createFloorSchema.parse(body);
    const floor = await this.buildingService.createFloor(buildingId, validated);
    return toFloorResponseDto(floor);
  }

  @Get('buildings/:buildingId/floors')
  @RequirePermission(PERMISSIONS.FLOOR_VIEW)
  @ApiOperation({ summary: 'List floors in a building' })
  async findMany(
    @Param('buildingId') buildingId: string,
    @Query() query: unknown,
  ): Promise<{ items: FloorResponseDto[]; total: number }> {
    const validated = floorQuerySchema.parse(query);
    const result = await this.buildingService.findFloors(buildingId, validated);
    return {
      items: result.items.map((f) => toFloorResponseDto(f)),
      total: result.total,
    };
  }

  @Get('floors/:floorId')
  @RequirePermission(PERMISSIONS.FLOOR_VIEW)
  @ApiOperation({ summary: 'Get floor details by ID' })
  async findById(@Param('floorId') floorId: string): Promise<FloorResponseDto> {
    const floor = await this.buildingService.findFloorById(floorId);
    return toFloorResponseDto(floor);
  }

  @Patch('floors/:floorId')
  @RequirePermission(PERMISSIONS.FLOOR_UPDATE)
  @ApiOperation({ summary: 'Update floor label and sort order' })
  async update(
    @Param('floorId') floorId: string,
    @Body() body: unknown,
  ): Promise<FloorResponseDto> {
    const validated = updateFloorSchema.parse(body);
    const updated = await this.buildingService.updateFloor(floorId, validated);
    return toFloorResponseDto(updated);
  }
}
