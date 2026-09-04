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
import { TenancyRepository } from './tenancy.repository.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  createTenancySchema,
  updateTenancySchema,
  tenancyQuerySchema,
} from '@community-os/validation';
import { toTenancyResponseDto, type TenancyResponseDto } from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Residents - Tenancies')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class TenanciesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyRepo: TenancyRepository,
    private readonly authService: AuthorizationService,
  ) {}

  @Post('units/:unitId/tenancies')
  @ApiOperation({ summary: 'Create a rental tenancy agreement for a unit' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Tenancy created' })
  async createTenancy(
    @Param('unitId') unitId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TenancyResponseDto> {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.TENANCY_MANAGE, {
      scopeType: 'COMMUNITY',
      scopeId: unit.communityId,
    });

    const validated = createTenancySchema.parse(body);
    const tenancy = await this.tenancyRepo.create(unit.organizationId, unit.communityId, {
      ...validated,
      unitId,
    });
    return toTenancyResponseDto(tenancy);
  }

  @Get('units/:unitId/tenancies')
  @ApiOperation({ summary: 'List tenancies for a unit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of tenancies' })
  async listTenanciesForUnit(
    @Param('unitId') unitId: string,
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: TenancyResponseDto[]; total: number }> {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.TENANCY_VIEW, {
      scopeType: 'COMMUNITY',
      scopeId: unit.communityId,
    });

    const validated = tenancyQuerySchema.parse(query);
    const result = await this.tenancyRepo.findByUnitId(unitId, validated);
    return {
      items: result.items.map((t) => toTenancyResponseDto(t)),
      total: result.total,
    };
  }

  @Get('tenancies/:id')
  @ApiOperation({ summary: 'Get tenancy details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tenancy details' })
  async getTenancy(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TenancyResponseDto> {
    const tenancy = await this.tenancyRepo.findById(id);
    if (!tenancy) {
      throw new DomainException('TENANCY_NOT_FOUND', 'Tenancy not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.TENANCY_VIEW, {
      scopeType: 'COMMUNITY',
      scopeId: tenancy.communityId,
    });

    return toTenancyResponseDto(tenancy);
  }

  @Patch('tenancies/:id')
  @ApiOperation({ summary: 'Update tenancy agreement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tenancy updated' })
  async updateTenancy(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TenancyResponseDto> {
    const existing = await this.tenancyRepo.findById(id);
    if (!existing) {
      throw new DomainException('TENANCY_NOT_FOUND', 'Tenancy not found.', HttpStatus.NOT_FOUND);
    }

    await this.authService.enforce(actor, PERMISSIONS.TENANCY_MANAGE, {
      scopeType: 'COMMUNITY',
      scopeId: existing.communityId,
    });

    const validated = updateTenancySchema.parse(body);
    const updated = await this.tenancyRepo.update(id, validated);
    return toTenancyResponseDto(updated);
  }
}
