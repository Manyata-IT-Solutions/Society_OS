import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { Actor } from '@community-os/types';
import { ChargeDefinitionRepository } from './charge-definition.repository.js';
import { CreateChargeDefinitionSchema } from '@community-os/validation';
import {
  toChargeDefinitionResponseDto,
  ChargeDefinitionResponseDto,
} from '@community-os/contracts';

@Controller('billing/charges')
@UseGuards(AuthGuard, PermissionGuard)
export class ChargeDefinitionController {
  constructor(private readonly chargeRepo: ChargeDefinitionRepository) {}

  @Post()
  @RequirePermission(PERMISSIONS.BILLING_CHARGE_MANAGE)
  async create(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<ChargeDefinitionResponseDto> {
    const data = CreateChargeDefinitionSchema.parse(body);
    const orgId =
      (body as any).organizationId ||
      (actor as any).organizationId ||
      (actor as any).tenantId ||
      '';
    const cd = await this.chargeRepo.create({
      organization: { connect: { id: orgId } },
      code: data.code,
      name: data.name,
      description: data.description,
      category: data.category,
      chargeNature: data.chargeNature,
      recurrenceType: data.recurrenceType,
      defaultCalculation: data.defaultCalculation,
      defaultUOM: data.defaultUOM,
      taxable: data.taxable,
      accountingMappingKey: data.accountingMappingKey,
      isActive: data.isActive,
    });
    return toChargeDefinitionResponseDto(cd);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async getById(@Param('id') id: string): Promise<ChargeDefinitionResponseDto | null> {
    const cd = await this.chargeRepo.findById(id);
    return cd ? toChargeDefinitionResponseDto(cd) : null;
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async list(
    @Query('organizationId') organizationId: string,
  ): Promise<ChargeDefinitionResponseDto[]> {
    const items = await this.chargeRepo.list({ organizationId });
    return items.map(toChargeDefinitionResponseDto);
  }
}
