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
import { UnitService } from './unit.service.js';
import { BulkUnitService } from './bulk-unit.service.js';
import { PropertyHierarchyService } from './property-hierarchy.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import {
  createUnitSchema,
  updateUnitSchema,
  unitQuerySchema,
  bulkCreateUnitsSchema,
} from '@community-os/validation';
import {
  toUnitResponseDto,
  type UnitResponseDto,
  type BulkCreateUnitsResultDto,
} from '@community-os/contracts';

@ApiTags('Property - Units')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class UnitsController {
  constructor(
    private readonly unitService: UnitService,
    private readonly bulkUnitService: BulkUnitService,
    private readonly hierarchyService: PropertyHierarchyService,
  ) {}

  @Post('communities/:communityId/units')
  @RequirePermission(PERMISSIONS.UNIT_CREATE, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Create a unit (e.g. standalone villa or direct section unit)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Unit created' })
  async createDirect(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
  ): Promise<UnitResponseDto> {
    const validated = createUnitSchema.parse(body);
    const unit = await this.unitService.createUnit(communityId, validated);
    const path = await this.hierarchyService.generateUnitPath(unit);
    return toUnitResponseDto(unit, path);
  }

  @Post('buildings/:buildingId/units')
  @RequirePermission(PERMISSIONS.UNIT_CREATE)
  @ApiOperation({ summary: 'Create a unit inside a building' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Unit created' })
  async createInBuilding(
    @Param('buildingId') buildingId: string,
    @Body() body: unknown,
  ): Promise<UnitResponseDto> {
    const validated = createUnitSchema.parse(body);
    const unitInput = { ...validated, buildingId };
    // Fetch building to get communityId
    const unit = await this.unitService.createUnit(
      (body as Record<string, string>)['communityId'] || '',
      unitInput,
    );
    const path = await this.hierarchyService.generateUnitPath(unit);
    return toUnitResponseDto(unit, path);
  }

  @Post('communities/:communityId/units/bulk')
  @RequirePermission(PERMISSIONS.UNIT_CREATE, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Bulk generate units across floors using structured patterns' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Units generated in bulk' })
  async bulkCreate(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
  ): Promise<BulkCreateUnitsResultDto> {
    const validated = bulkCreateUnitsSchema.parse(body);
    return this.bulkUnitService.generateBulkUnits(communityId, validated);
  }

  @Get('communities/:communityId/units')
  @RequirePermission(PERMISSIONS.UNIT_VIEW, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'List and search units within a community' })
  async findMany(
    @Param('communityId') communityId: string,
    @Query() query: unknown,
  ): Promise<{ items: UnitResponseDto[]; total: number }> {
    const validated = unitQuerySchema.parse(query);
    const result = await this.unitService.findMany(communityId, validated);
    return {
      items: result.items.map((u) => toUnitResponseDto(u)),
      total: result.total,
    };
  }

  @Get('units/:unitId')
  @RequirePermission(PERMISSIONS.UNIT_VIEW)
  @ApiOperation({ summary: 'Get unit details by ID' })
  async findById(@Param('unitId') unitId: string): Promise<UnitResponseDto> {
    const unit = await this.unitService.findById(unitId);
    const path = await this.hierarchyService.generateUnitPath(unit);
    return toUnitResponseDto(unit, path);
  }

  @Patch('units/:unitId')
  @RequirePermission(PERMISSIONS.UNIT_UPDATE)
  @ApiOperation({ summary: 'Update unit specifications and status' })
  async update(@Param('unitId') unitId: string, @Body() body: unknown): Promise<UnitResponseDto> {
    const validated = updateUnitSchema.parse(body);
    const updated = await this.unitService.updateUnit(unitId, validated);
    const path = await this.hierarchyService.generateUnitPath(updated);
    return toUnitResponseDto(updated, path);
  }
}
