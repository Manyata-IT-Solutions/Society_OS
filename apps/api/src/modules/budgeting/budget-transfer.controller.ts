import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BudgetTransferService } from './budget-transfer.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('budget-transfers')
@UseGuards(AuthGuard, PermissionGuard)
export class BudgetTransferController {
  constructor(private readonly transferService: BudgetTransferService) {}

  @Post()
  @RequirePermission(PERMISSIONS.BUDGET_TRANSFER_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.transferService.createTransfer(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_VIEW)
  async list(@Query('budgetLineId') budgetLineId: string) {
    return this.transferService.listTransfers(budgetLineId);
  }
}
