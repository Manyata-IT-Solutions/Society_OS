import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { Actor } from '@community-os/types';
import { BillingRunService } from './billing-run.service.js';
import { CreateBillingRunSchema } from '@community-os/validation';
import { toBillingRunResponseDto, BillingRunResponseDto } from '@community-os/contracts';

@Controller('billing/runs')
@UseGuards(AuthGuard, PermissionGuard)
export class BillingRunController {
  constructor(private readonly runService: BillingRunService) {}

  @Post('preview')
  @RequirePermission(PERMISSIONS.BILLING_RUN_CREATE)
  async preview(
    @Body() body: { communityId: string; billingPeriodId: string; billingPlanId: string },
  ) {
    return this.runService.previewBillingRun(
      body.communityId,
      body.billingPeriodId,
      body.billingPlanId,
    );
  }

  @Post()
  @RequirePermission(PERMISSIONS.BILLING_RUN_CREATE)
  async execute(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<BillingRunResponseDto> {
    const data = CreateBillingRunSchema.parse(body);
    const run = await this.runService.executeBillingRun(
      {
        ...data,
        autoIssue: (body as any).autoIssue !== false,
      },
      actor,
    );
    return toBillingRunResponseDto(run);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async getById(@Param('id') id: string): Promise<BillingRunResponseDto> {
    const run = await this.runService.getBillingRun(id);
    return toBillingRunResponseDto(run);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async list(@Query('communityId') communityId: string): Promise<BillingRunResponseDto[]> {
    const items = await this.runService.listBillingRuns({ communityId });
    return items.map(toBillingRunResponseDto);
  }
}
