import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { Actor } from '@community-os/types';
import { BillableAccountRepository } from './billable-account.repository.js';
import { CreateBillableAccountSchema } from '@community-os/validation';
import { toBillableAccountResponseDto, BillableAccountResponseDto } from '@community-os/contracts';

@Controller('billing/accounts')
@UseGuards(AuthGuard, PermissionGuard)
export class BillableAccountController {
  constructor(private readonly accountRepo: BillableAccountRepository) {}

  @Post()
  @RequirePermission(PERMISSIONS.BILLING_MANAGE)
  async create(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<BillableAccountResponseDto> {
    const data = CreateBillableAccountSchema.parse(body);
    const account = await this.accountRepo.create({
      organization: {
        connect: {
          id:
            (body as any).organizationId ||
            (actor as any).organizationId ||
            (actor as any).tenantId ||
            '',
        },
      },
      community: { connect: { id: data.communityId } },
      accountNumber: data.accountNumber,
      accountType: data.accountType,
      displayName: data.displayName,
      unit: data.unitId ? { connect: { id: data.unitId } } : undefined,
      household: data.householdId ? { connect: { id: data.householdId } } : undefined,
      resident: data.residentId ? { connect: { id: data.residentId } } : undefined,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      metadata: (data.metadata as any) || {},
    });
    await this.accountRepo['prisma'].residentAccount.upsert({
      where: { billableAccountId: account.id },
      update: {},
      create: {
        billableAccount: { connect: { id: account.id } },
        accountNumber: `RA-${account.accountNumber}`,
        openingBalance: 0,
        currentBalance: 0,
      },
    });
    return toBillableAccountResponseDto(account);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async getById(@Param('id') id: string): Promise<BillableAccountResponseDto | null> {
    const acc = await this.accountRepo.findById(id);
    return acc ? toBillableAccountResponseDto(acc) : null;
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async list(@Query('communityId') communityId: string): Promise<BillableAccountResponseDto[]> {
    const [items] = await this.accountRepo.list({ communityId });
    return items.map(toBillableAccountResponseDto);
  }
}
