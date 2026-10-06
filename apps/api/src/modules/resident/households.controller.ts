import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HouseholdService } from './household.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  createHouseholdSchema,
  updateHouseholdSchema,
  householdQuerySchema,
  addHouseholdMemberSchema,
} from '@community-os/validation';
import {
  toHouseholdResponseDto,
  toHouseholdMemberResponseDto,
  type HouseholdResponseDto,
  type HouseholdMemberResponseDto,
} from '@community-os/contracts';

@ApiTags('Residents - Households')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class HouseholdsController {
  constructor(
    private readonly householdService: HouseholdService,
    private readonly authService: AuthorizationService,
  ) {}

  @Post('units/:unitId/households')
  @ApiOperation({ summary: 'Create a household for a unit' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Household created' })
  async createHousehold(
    @Param('unitId') unitId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<HouseholdResponseDto> {
    const validated = createHouseholdSchema.parse(body);
    const household = await this.householdService.createHousehold(unitId, validated);
    await this.authService.enforce(actor, PERMISSIONS.HOUSEHOLD_CREATE, {
      scopeType: 'COMMUNITY',
      scopeId: household.communityId,
    });
    return toHouseholdResponseDto(household);
  }

  @Get('units/:unitId/households')
  @ApiOperation({ summary: 'List households associated with a unit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of households' })
  async listHouseholdsForUnit(
    @Param('unitId') unitId: string,
    @Query() query: unknown,
  ): Promise<{ items: HouseholdResponseDto[]; total: number }> {
    const validated = householdQuerySchema.parse(query);
    const result = await this.householdService.listHouseholdsForUnit(unitId, validated);
    return {
      items: result.items.map((h) => toHouseholdResponseDto(h)),
      total: result.total,
    };
  }

  @Get('communities/:communityId/households')
  @ApiOperation({ summary: 'List households associated with a community' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of households' })
  async listHouseholdsForCommunity(
    @Param('communityId') communityId: string,
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: HouseholdResponseDto[]; total: number }> {
    await this.authService.enforce(actor, PERMISSIONS.HOUSEHOLD_VIEW, {
      scopeType: 'COMMUNITY',
      scopeId: communityId,
    });
    const validated = householdQuerySchema.parse(query);
    const result = await this.householdService.listHouseholdsForCommunity(communityId, validated);
    return {
      items: result.items.map((h) => toHouseholdResponseDto(h)),
      total: result.total,
    };
  }

  @Get('households/:id')
  @ApiOperation({ summary: 'Get household details and member list' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Household details' })
  async getHousehold(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<HouseholdResponseDto> {
    const household = await this.householdService.findHouseholdById(id);
    await this.authService.enforce(actor, PERMISSIONS.HOUSEHOLD_VIEW, {
      scopeType: 'COMMUNITY',
      scopeId: household.communityId,
    });
    return toHouseholdResponseDto(household);
  }

  @Patch('households/:id')
  @ApiOperation({ summary: 'Update household details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Household updated' })
  async updateHousehold(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<HouseholdResponseDto> {
    const existing = await this.householdService.findHouseholdById(id);
    await this.authService.enforce(actor, PERMISSIONS.HOUSEHOLD_UPDATE, {
      scopeType: 'COMMUNITY',
      scopeId: existing.communityId,
    });

    const validated = updateHouseholdSchema.parse(body);
    const updated = await this.householdService.updateHousehold(id, validated);
    return toHouseholdResponseDto(updated);
  }

  @Post('households/:id/members')
  @ApiOperation({ summary: 'Add a resident member to a household' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Member added' })
  async addMember(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<HouseholdMemberResponseDto> {
    const existing = await this.householdService.findHouseholdById(id);
    await this.authService.enforce(actor, PERMISSIONS.HOUSEHOLD_MEMBER_MANAGE, {
      scopeType: 'COMMUNITY',
      scopeId: existing.communityId,
    });

    const validated = addHouseholdMemberSchema.parse(body);
    const member = await this.householdService.addMember(id, validated);
    return toHouseholdMemberResponseDto(member);
  }

  @Delete('households/:id/members/:residentId')
  @ApiOperation({ summary: 'Remove a resident member from a household' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Member removed' })
  async removeMember(
    @Param('id') id: string,
    @Param('residentId') residentId: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    const existing = await this.householdService.findHouseholdById(id);
    await this.authService.enforce(actor, PERMISSIONS.HOUSEHOLD_MEMBER_MANAGE, {
      scopeType: 'COMMUNITY',
      scopeId: existing.communityId,
    });

    await this.householdService.removeMember(id, residentId);
  }
}
