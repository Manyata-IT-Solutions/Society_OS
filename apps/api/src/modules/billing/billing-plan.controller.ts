import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { BillingPlanRepository } from './billing-plan.repository.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateBillingPlanSchema, CreateChargeRuleSchema } from '@community-os/validation';
import {
  toBillingPlanResponseDto,
  toChargeRuleResponseDto,
  BillingPlanResponseDto,
  ChargeRuleResponseDto,
} from '@community-os/contracts';

@Controller('billing/plans')
@UseGuards(AuthGuard, PermissionGuard)
export class BillingPlanController {
  constructor(
    private readonly planRepo: BillingPlanRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermission(PERMISSIONS.BILLING_PLAN_MANAGE)
  async create(@Body() body: unknown): Promise<BillingPlanResponseDto> {
    const data = CreateBillingPlanSchema.parse(body);
    const plan = await this.planRepo.create({
      community: { connect: { id: data.communityId } },
      code: data.code,
      name: data.name,
      description: data.description,
      recurrenceType: data.recurrenceType,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      isActive: data.isActive,
    });
    return toBillingPlanResponseDto(plan);
  }

  @Post(':id/rules')
  @RequirePermission(PERMISSIONS.BILLING_PLAN_MANAGE)
  async addRule(
    @Param('id') planId: string,
    @Body() body: unknown,
  ): Promise<ChargeRuleResponseDto> {
    const data = CreateChargeRuleSchema.parse({ ...(body as any), billingPlanId: planId });
    const rule = await this.prisma.chargeRule.create({
      data: {
        billingPlan: { connect: { id: planId } },
        chargeDefinition: { connect: { id: data.chargeDefinitionId } },
        calculationMethod: data.calculationMethod,
        amount: data.amount,
        rate: data.rate,
        minimumAmount: data.minimumAmount,
        maximumAmount: data.maximumAmount,
        roundingPolicy: data.roundingPolicy,
        dueDays: data.dueDays,
        graceDays: data.graceDays,
        fund: data.fundId ? { connect: { id: data.fundId } } : undefined,
        costCenter: data.costCenterId ? { connect: { id: data.costCenterId } } : undefined,
        priority: data.priority,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
        isActive: data.isActive,
      },
      include: { chargeDefinition: true, fund: true, costCenter: true },
    });
    return toChargeRuleResponseDto(rule);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async getById(@Param('id') id: string): Promise<BillingPlanResponseDto | null> {
    const plan = await this.planRepo.findById(id);
    return plan ? toBillingPlanResponseDto(plan) : null;
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async list(@Query('communityId') communityId: string): Promise<BillingPlanResponseDto[]> {
    const items = await this.planRepo.list({ communityId });
    return items.map(toBillingPlanResponseDto);
  }
}
