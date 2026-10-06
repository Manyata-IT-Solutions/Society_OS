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
import { SupplierCreditNoteService } from './supplier-credit-note.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/credit-notes')
@UseGuards(AuthGuard, PermissionGuard)
export class SupplierCreditNoteController {
  constructor(private readonly creditNoteService: SupplierCreditNoteService) {}

  @Post()
  @RequirePermission(PERMISSIONS.AP_CREDIT_NOTE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.creditNoteService.createCreditNote(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.AP_CREDIT_NOTE_VIEW)
  async list(@Query('accountingEntityId') accountingEntityId: string) {
    return this.creditNoteService.list(accountingEntityId);
  }
}
