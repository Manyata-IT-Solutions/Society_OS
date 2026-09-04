import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JournalEntryService } from './journal-entry.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreateJournalEntrySchema,
  ReverseJournalSchema,
  ImportOpeningBalancesSchema,
} from '@community-os/validation';
import { toJournalEntryResponseDto } from '@community-os/contracts';

@Controller('finance/journals')
@UseGuards(AuthGuard, PermissionGuard)
export class JournalEntryController {
  constructor(private readonly journalService: JournalEntryService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FINANCE_JOURNAL_CREATE)
  async createDraft(@Body() body: any, @CurrentActor() actor: Actor) {
    const validated = CreateJournalEntrySchema.parse(body);
    const journal = await this.journalService.createDraft(validated, actor);
    return toJournalEntryResponseDto(journal);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FINANCE_JOURNAL_VIEW)
  async getJournal(@Param('id', ParseUUIDPipe) id: string) {
    const journal = await this.journalService.getJournal(id);
    return toJournalEntryResponseDto(journal);
  }

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE_JOURNAL_VIEW)
  async listJournals(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @Query('status') status?: any,
    @Query('journalType') journalType?: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const result = await this.journalService.listJournals({
      accountingEntityId,
      status,
      journalType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
    return result.items.map(toJournalEntryResponseDto);
  }

  @Post(':id/submit')
  @RequirePermission(PERMISSIONS.FINANCE_JOURNAL_SUBMIT)
  async submitJournal(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const journal = await this.journalService.submitJournal(id, actor);
    return toJournalEntryResponseDto(journal);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.FINANCE_JOURNAL_APPROVE)
  async approveJournal(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const journal = await this.journalService.approveJournal(id, actor);
    return toJournalEntryResponseDto(journal);
  }

  @Post(':id/post')
  @RequirePermission(PERMISSIONS.FINANCE_JOURNAL_POST)
  async postJournal(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const journal = await this.journalService.postJournal(id, actor);
    return toJournalEntryResponseDto(journal);
  }

  @Post(':id/reverse')
  @RequirePermission(PERMISSIONS.FINANCE_JOURNAL_REVERSE)
  async reverseJournal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = ReverseJournalSchema.parse(body);
    const rev = await this.journalService.reverseJournal(id, validated, actor);
    return toJournalEntryResponseDto(rev);
  }

  @Post('opening-balances/import')
  @RequirePermission(PERMISSIONS.FINANCE_OPENING_BALANCE_MANAGE)
  async importOpeningBalances(@Body() body: any, @CurrentActor() actor: Actor) {
    const validated = ImportOpeningBalancesSchema.parse(body);
    const posted = await this.journalService.importOpeningBalances(validated, actor);
    return toJournalEntryResponseDto(posted);
  }
}
