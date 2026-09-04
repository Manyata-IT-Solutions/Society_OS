import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OccupancyService } from './occupancy.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { moveInSchema, moveOutSchema, occupancyQuerySchema } from '@community-os/validation';
import {
  toOccupancyResponseDto,
  type OccupancyResponseDto,
  type MoveInResultDto,
  type UnitResidentialStateDto,
} from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Residents - Occupancies')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class OccupanciesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly occupancyService: OccupancyService,
    private readonly authService: AuthorizationService,
  ) {}

  @Post('units/:unitId/move-in')
  @ApiOperation({ summary: 'Execute transactional Move-In for owner or tenant household' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Move-in completed successfully' })
  async moveIn(
    @Param('unitId') unitId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<MoveInResultDto> {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.OCCUPANCY_MOVE_IN, {
      scopeType: 'COMMUNITY',
      scopeId: unit.communityId,
    });

    const validated = moveInSchema.parse(body);
    return this.occupancyService.moveIn(unitId, validated);
  }

  @Post('occupancies/:id/move-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute transactional Move-Out and end unit occupancy' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Move-out completed' })
  async moveOut(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<OccupancyResponseDto> {
    const occupancy = await this.prisma.unitOccupancy.findUnique({ where: { id } });
    if (!occupancy) {
      throw new DomainException(
        'OCCUPANCY_NOT_FOUND',
        'Occupancy not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.authService.enforce(actor, PERMISSIONS.OCCUPANCY_MOVE_OUT, {
      scopeType: 'COMMUNITY',
      scopeId: occupancy.communityId,
    });

    const validated = moveOutSchema.parse(body);
    return this.occupancyService.moveOut(id, validated);
  }

  @Get('units/:unitId/occupancy/current')
  @ApiOperation({ summary: 'Get current active occupancy and household for a unit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current unit occupancy' })
  async getCurrentOccupancy(
    @Param('unitId') unitId: string,
    @CurrentActor() actor: Actor,
  ): Promise<OccupancyResponseDto | null> {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.OCCUPANCY_VIEW, {
      scopeType: 'COMMUNITY',
      scopeId: unit.communityId,
    });

    const current = await this.occupancyService.getCurrentUnitOccupancy(unitId);
    return current ? toOccupancyResponseDto(current) : null;
  }

  @Get('units/:unitId/residential-state')
  @ApiOperation({
    summary: 'Get full residential state (current & historical occupancy, owners, tenancy)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comprehensive residential unit state' })
  async getResidentialState(
    @Param('unitId') unitId: string,
    @CurrentActor() actor: Actor,
  ): Promise<UnitResidentialStateDto> {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.OCCUPANCY_VIEW, {
      scopeType: 'COMMUNITY',
      scopeId: unit.communityId,
    });

    return this.occupancyService.getUnitResidentialState(unitId);
  }

  @Get('units/:unitId/occupancies')
  @ApiOperation({ summary: 'List all occupancy records for a unit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Occupancy history' })
  async listOccupancies(
    @Param('unitId') unitId: string,
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: OccupancyResponseDto[]; total: number }> {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.OCCUPANCY_VIEW, {
      scopeType: 'COMMUNITY',
      scopeId: unit.communityId,
    });

    const validated = occupancyQuerySchema.parse(query);
    const result = await this.occupancyService.listOccupanciesForUnit(unitId, validated);
    return {
      items: result.items.map((o) => toOccupancyResponseDto(o)),
      total: result.total,
    };
  }
}
