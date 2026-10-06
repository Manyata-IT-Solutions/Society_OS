import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { ReceiptService } from './receipt.service.js';
import { toReceiptResponseDto, ReceiptResponseDto } from '@community-os/contracts';

@Controller('billing/receipts')
@UseGuards(AuthGuard, PermissionGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_RECEIPT_VIEW)
  async getById(@Param('id') id: string): Promise<ReceiptResponseDto | null> {
    const r = await this.receiptService.getReceipt(id);
    return r ? toReceiptResponseDto(r) : null;
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_RECEIPT_VIEW)
  async list(
    @Query('communityId') communityId: string,
    @Query('billableAccountId') billableAccountId?: string,
  ): Promise<ReceiptResponseDto[]> {
    const [items] = await this.receiptService.listReceipts({ communityId, billableAccountId });
    return items.map(toReceiptResponseDto);
  }
}
