import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ChartOfAccountsService } from './chart-of-accounts.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreateLedgerAccountSchema,
  UpdateLedgerAccountSchema,
  CreateAccountMappingSchema,
} from '@community-os/validation';
import { toLedgerAccountResponseDto } from '@community-os/contracts';

@Controller('finance/accounts')
@UseGuards(AuthGuard, PermissionGuard)
export class ChartOfAccountsController {
  constructor(private readonly coaService: ChartOfAccountsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FINANCE_ACCOUNT_MANAGE)
  async createAccount(@Body() body: any, @CurrentActor() actor: Actor) {
    const validated = CreateLedgerAccountSchema.parse(body);
    const account = await this.coaService.createAccount(validated, actor);
    return toLedgerAccountResponseDto(account);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FINANCE_ACCOUNT_VIEW)
  async getAccount(@Param('id', ParseUUIDPipe) id: string) {
    const account = await this.coaService.getAccount(id);
    return toLedgerAccountResponseDto(account);
  }

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE_ACCOUNT_VIEW)
  async listAccounts(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @Query('accountType') accountType?: any,
    @Query('status') status?: any,
  ) {
    const accounts = await this.coaService.listAccounts(accountingEntityId, {
      accountType,
      status,
    });
    return accounts.map(toLedgerAccountResponseDto);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.FINANCE_ACCOUNT_MANAGE)
  async updateAccount(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    const validated = UpdateLedgerAccountSchema.parse(body);
    const account = await this.coaService.updateAccount(id, validated);
    return toLedgerAccountResponseDto(account);
  }

  @Post('mappings')
  @RequirePermission(PERMISSIONS.FINANCE_ACCOUNT_MAPPING_MANAGE)
  async createMapping(@Body() body: any) {
    const validated = CreateAccountMappingSchema.parse(body);
    const mapping = await this.coaService.createMapping(
      validated.accountingEntityId,
      validated.mappingKey,
      validated.accountId,
      validated.description ?? undefined,
    );
    return mapping;
  }

  @Get('mappings/list')
  @RequirePermission(PERMISSIONS.FINANCE_ACCOUNT_MAPPING_VIEW)
  async listMappings(@Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string) {
    const mappings = await this.coaService.listMappings(accountingEntityId);
    return mappings;
  }

  @Post('template/standard-society')
  @RequirePermission(PERMISSIONS.FINANCE_ACCOUNT_MANAGE)
  async applyStandardTemplate(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @CurrentActor() actor: Actor,
  ) {
    const result = await this.coaService.applyStandardSocietyTemplate(accountingEntityId, actor);
    return result;
  }
}
