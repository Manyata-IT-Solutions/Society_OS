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
import { BankStatementImportService } from './bank-statement-import.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('treasury/statements')
@UseGuards(AuthGuard, PermissionGuard)
export class BankStatementController {
  constructor(private readonly importService: BankStatementImportService) {}

  @Post('import')
  @RequirePermission(PERMISSIONS.TREASURY_STATEMENT_IMPORT)
  @HttpCode(HttpStatus.CREATED)
  async importStatement(@Body() body: any) {
    return this.importService.importStatement(body);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TREASURY_RECONCILIATION_VIEW)
  async list(@Query('bankAccountId') bankAccountId: string) {
    return this.importService.listStatements(bankAccountId);
  }
}
