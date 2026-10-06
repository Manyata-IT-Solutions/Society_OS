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
import { OwnershipService } from './ownership.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  createOwnershipSchema,
  transferOwnershipSchema,
  ownershipQuerySchema,
} from '@community-os/validation';
import { toOwnershipResponseDto, type OwnershipResponseDto } from '@community-os/contracts';

@ApiTags('Residents - Ownership')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class OwnershipController {
  constructor(
    private readonly ownershipService: OwnershipService,
    private readonly authService: AuthorizationService,
  ) {}

  @Post('units/:unitId/ownership')
  @ApiOperation({ summary: 'Assign legal ownership of a unit' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ownership assigned' })
  async createOwnership(
    @Param('unitId') unitId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<OwnershipResponseDto> {
    const validated = createOwnershipSchema.parse(body);
    const ownership = await this.ownershipService.createOwnership(unitId, validated);
    await this.authService.enforce(actor, PERMISSIONS.OWNERSHIP_MANAGE, {
      scopeType: 'COMMUNITY',
      scopeId: ownership.communityId,
    });
    return toOwnershipResponseDto(ownership);
  }

  @Post('units/:unitId/ownership/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer property title to incoming owners' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ownership transferred' })
  async transferOwnership(
    @Param('unitId') unitId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<OwnershipResponseDto[]> {
    const validated = transferOwnershipSchema.parse(body);
    const createdOwners = await this.ownershipService.transferOwnership(unitId, validated);
    if (createdOwners.length > 0) {
      await this.authService.enforce(actor, PERMISSIONS.OWNERSHIP_MANAGE, {
        scopeType: 'COMMUNITY',
        scopeId: createdOwners[0]!.communityId,
      });
    }
    return createdOwners.map((o) => toOwnershipResponseDto(o));
  }

  @Get('units/:unitId/ownership')
  @ApiOperation({ summary: 'List ownership records for a unit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of ownership records' })
  async listOwnershipForUnit(
    @Param('unitId') unitId: string,
    @Query() query: unknown,
  ): Promise<{ items: OwnershipResponseDto[]; total: number }> {
    const validated = ownershipQuerySchema.parse(query);
    const result = await this.ownershipService.listOwnershipForUnit(unitId, validated);
    return {
      items: result.items.map((o) => toOwnershipResponseDto(o)),
      total: result.total,
    };
  }

  @Get('residents/:residentId/ownership')
  @ApiOperation({ summary: 'List owned units for a resident' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of resident ownerships' })
  async listOwnershipForResident(
    @Param('residentId') residentId: string,
  ): Promise<OwnershipResponseDto[]> {
    const result = await this.ownershipService.listOwnershipForResident(residentId);
    return result.map((o) => toOwnershipResponseDto(o));
  }
}
