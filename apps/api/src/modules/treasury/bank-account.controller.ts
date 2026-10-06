import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BankAccountService } from './bank-account.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('treasury/accounts')
@UseGuards(AuthGuard, PermissionGuard)
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  @RequirePermission(PERMISSIONS.TREASURY_BANK_ACCOUNT_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.bankAccountService.create(body);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TREASURY_BANK_ACCOUNT_VIEW)
  async list(@Query('accountingEntityId') accountingEntityId: string) {
    return this.bankAccountService.list(accountingEntityId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TREASURY_BANK_ACCOUNT_VIEW)
  async getById(@Param('id') id: string) {
    return this.bankAccountService.findById(id);
  }
}
