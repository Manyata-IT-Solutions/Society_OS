import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { BillingPeriodRepository } from './billing-period.repository.js';
import { CreateBillingPeriodSchema } from '@community-os/validation';
import { toBillingPeriodResponseDto, BillingPeriodResponseDto } from '@community-os/contracts';

@Controller('billing/periods')
@UseGuards(AuthGuard, PermissionGuard)
export class BillingPeriodController {
  constructor(private readonly periodRepo: BillingPeriodRepository) {}

  @Post()
  @RequirePermission(PERMISSIONS.BILLING_MANAGE)
  async create(@Body() body: unknown): Promise<BillingPeriodResponseDto> {
    const data = CreateBillingPeriodSchema.parse(body);
    const period = await this.periodRepo.create({
      community: { connect: { id: data.communityId } },
      name: data.name,
      code: data.code,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(data.startDate),
      dueDate: new Date(data.dueDate),
      graceDate: new Date(data.graceDate),
      status: 'OPEN',
    });
    return toBillingPeriodResponseDto(period);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async getById(@Param('id') id: string): Promise<BillingPeriodResponseDto | null> {
    const period = await this.periodRepo.findById(id);
    return period ? toBillingPeriodResponseDto(period) : null;
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async list(@Query('communityId') communityId: string): Promise<BillingPeriodResponseDto[]> {
    const items = await this.periodRepo.list({ communityId });
    return items.map(toBillingPeriodResponseDto);
  }
}
