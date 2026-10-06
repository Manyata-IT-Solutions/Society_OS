import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JournalEntryRepository } from './journal-entry.repository.js';
import { FiscalCalendarRepository } from './fiscal-calendar.repository.js';
import { FinancialSequenceService } from './financial-sequence.service.js';
import { FinancialPostingService } from './financial-posting.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor } from '@community-os/types';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class JournalEntryService {
  constructor(
    private readonly journalRepo: JournalEntryRepository,
    private readonly fiscalRepo: FiscalCalendarRepository,
    private readonly sequenceService: FinancialSequenceService,
    private readonly postingService: FinancialPostingService,
    private readonly eventsService: EventsService,
    private readonly prisma: PrismaService,
  ) {}

  async createDraft(
    data: {
      accountingEntityId: string;
      journalType?: any;
      journalDate: string | Date;
      description: string;
      reference?: string | null;
      sourceModule?: string | null;
      sourceType?: string | null;
      sourceId?: string | null;
      postingPurpose?: string | null;
      currency?: string;
      exchangeRate?: number | null;
      idempotencyKey?: string | null;
      lines: Array<{
        accountId: string;
        description: string;
        debitAmount: number;
        creditAmount: number;
        costCenterId?: string | null;
        fundId?: string | null;
        partyType?: string | null;
        partyId?: string | null;
        dimensions?: Record<string, any>;
        sourceLineReference?: string | null;
      }>;
    },
    actor: Actor,
  ) {
    if (data.sourceModule && data.sourceType && data.sourceId) {
      const existing = await this.journalRepo.findBySource(
        data.sourceModule,
        data.sourceType,
        data.sourceId,
        data.postingPurpose || undefined,
      );
      if (existing) {
        return existing;
      }
    }

    const journalDate = new Date(data.journalDate);

    const period = await this.fiscalRepo.findPeriodByDate(data.accountingEntityId, journalDate);
    if (!period) {
      throw new BadRequestException(
        `No fiscal period found for date ${journalDate.toISOString().split('T')[0]}`,
      );
    }

    const journalType = data.journalType || 'GENERAL';
    const journalNumber = await this.sequenceService.getNextNumber(
      data.accountingEntityId,
      journalType,
    );

    let totalDr = 0;
    let totalCr = 0;
    const linesCreateData: Prisma.JournalLineCreateWithoutJournalEntryInput[] = [];

    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      if (!line) continue;
      const dr = Number(line.debitAmount) || 0;
      const cr = Number(line.creditAmount) || 0;
      const base = dr > 0 ? dr : cr;

      totalDr += dr;
      totalCr += cr;

      linesCreateData.push({
        lineNumber: i + 1,
        account: { connect: { id: line.accountId } },
        description: line.description,
        debitAmount: new Prisma.Decimal(dr),
        creditAmount: new Prisma.Decimal(cr),
        baseAmount: new Prisma.Decimal(base),
        costCenter: line.costCenterId ? { connect: { id: line.costCenterId } } : undefined,
        fund: line.fundId ? { connect: { id: line.fundId } } : undefined,
        partyType: line.partyType,
        partyId: line.partyId,
        dimensions: (line.dimensions as any) || {},
        sourceLineReference: line.sourceLineReference,
      });
    }

    const journal = await this.journalRepo.create({
      accountingEntity: { connect: { id: data.accountingEntityId } },
      journalNumber,
      journalType,
      journalDate,
      fiscalYear: { connect: { id: period.fiscalYearId } },
      accountingPeriod: { connect: { id: period.id } },
      status: 'DRAFT',
      description: data.description,
      reference: data.reference,
      sourceModule: data.sourceModule,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      postingPurpose: data.postingPurpose,
      currency: data.currency || 'INR',
      exchangeRate: data.exchangeRate ? new Prisma.Decimal(data.exchangeRate) : null,
      totalDebit: new Prisma.Decimal(totalDr),
      totalCredit: new Prisma.Decimal(totalCr),
      idempotencyKey: data.idempotencyKey,
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      lines: {
        create: linesCreateData,
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_JOURNAL_CREATED ?? 'finance.journal.created.v1',
        { journalNumber: journal.journalNumber, totalDebit: totalDr, totalCredit: totalCr },
        {
          organizationId: data.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return journal;
  }

  async submitJournal(id: string, actor: Actor) {
    const journal = await this.journalRepo.findById(id);
    if (!journal) throw new NotFoundException('Journal entry not found');

    if (journal.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot submit journal with status ${journal.status}`);
    }

    const updated = await this.journalRepo.update(id, {
      status: 'SUBMITTED',
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_JOURNAL_SUBMITTED ?? 'finance.journal.submitted.v1',
        { journalNumber: journal.journalNumber },
        {
          organizationId: journal.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async approveJournal(id: string, actor: Actor) {
    const journal = await this.journalRepo.findById(id);
    if (!journal) throw new NotFoundException('Journal entry not found');

    if (journal.status !== 'SUBMITTED' && journal.status !== 'UNDER_APPROVAL') {
      throw new BadRequestException(`Cannot approve journal with status ${journal.status}`);
    }

    const updated = await this.journalRepo.update(id, {
      status: 'APPROVED',
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_JOURNAL_APPROVED ?? 'finance.journal.approved.v1',
        { journalNumber: journal.journalNumber },
        {
          organizationId: journal.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async postJournal(id: string, actor: Actor) {
    const journal = await this.journalRepo.findById(id);
    if (!journal) throw new NotFoundException('Journal entry not found');

    return this.postingService.postJournal({
      accountingEntityId: journal.accountingEntityId,
      journalEntryId: id,
      actor,
    });
  }

  async reverseJournal(
    id: string,
    data: { reversalDate?: string | Date; reason: string },
    actor: Actor,
  ) {
    const original = await this.journalRepo.findById(id);
    if (!original) throw new NotFoundException('Original journal entry not found');

    if (original.status !== 'POSTED') {
      throw new BadRequestException('Only POSTED journals can be reversed');
    }

    if (original.reversalJournalId) {
      throw new ConflictException('Journal has already been reversed');
    }

    const reversalDate = data.reversalDate ? new Date(data.reversalDate) : new Date();

    const period = await this.fiscalRepo.findPeriodByDate(
      original.accountingEntityId,
      reversalDate,
    );
    if (!period) {
      throw new BadRequestException(
        `No fiscal period found for reversal date ${reversalDate.toISOString().split('T')[0]}`,
      );
    }

    const reversalNumber = await this.sequenceService.getNextNumber(
      original.accountingEntityId,
      'REVERSAL',
    );

    const oppositeLines: Prisma.JournalLineCreateWithoutJournalEntryInput[] = original.lines.map(
      (l, idx) => ({
        lineNumber: idx + 1,
        account: { connect: { id: l.accountId } },
        description: `Reversal: ${l.description} (Reason: ${data.reason})`,
        debitAmount: l.creditAmount,
        creditAmount: l.debitAmount,
        baseAmount: l.baseAmount,
        costCenter: l.costCenterId ? { connect: { id: l.costCenterId } } : undefined,
        fund: l.fundId ? { connect: { id: l.fundId } } : undefined,
        partyType: l.partyType,
        partyId: l.partyId,
        dimensions: (l.dimensions as any) || {},
        sourceLineReference: l.id,
      }),
    );

    const reversalJournal = await this.journalRepo.create({
      accountingEntity: { connect: { id: original.accountingEntityId } },
      journalNumber: reversalNumber,
      journalType: 'REVERSAL',
      journalDate: reversalDate,
      fiscalYear: { connect: { id: period.fiscalYearId } },
      accountingPeriod: { connect: { id: period.id } },
      status: 'DRAFT',
      description: `Reversal of ${original.journalNumber}: ${data.reason}`,
      reference: original.journalNumber,
      sourceModule: 'finance',
      sourceType: 'JournalReversal',
      sourceId: original.id,
      currency: original.currency,
      totalDebit: original.totalCredit,
      totalCredit: original.totalDebit,
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      lines: {
        create: oppositeLines,
      },
    });

    const postedReversal = await this.postingService.postJournal({
      accountingEntityId: original.accountingEntityId,
      journalEntryId: reversalJournal.id,
      actor,
    });

    await this.journalRepo.update(original.id, {
      reversedAt: new Date(),
      reversalJournal: { connect: { id: reversalJournal.id } },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_JOURNAL_REVERSED ?? 'finance.journal.reversed.v1',
        {
          originalJournalNumber: original.journalNumber,
          reversalJournalNumber: reversalJournal.journalNumber,
          reason: data.reason,
        },
        {
          organizationId: original.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return postedReversal;
  }

  async importOpeningBalances(
    data: {
      accountingEntityId: string;
      fiscalYearId: string;
      asOfDate: string | Date;
      entries: Array<{
        accountCode: string;
        debitAmount: number;
        creditAmount: number;
        fundCode?: string | null;
        costCenterCode?: string | null;
        description?: string;
      }>;
    },
    actor: Actor,
  ) {
    const asOfDate = new Date(data.asOfDate);
    const period = await this.fiscalRepo.findPeriodByDate(data.accountingEntityId, asOfDate);
    if (!period) throw new BadRequestException('No fiscal period found for opening balance date');

    let totalDr = 0;
    let totalCr = 0;
    const linesInput: Array<{
      accountId: string;
      description: string;
      debitAmount: number;
      creditAmount: number;
      fundId?: string | null;
      costCenterId?: string | null;
    }> = [];

    for (const item of data.entries) {
      const acc = await this.prisma.ledgerAccount.findUnique({
        where: {
          accountingEntityId_accountCode: {
            accountingEntityId: data.accountingEntityId,
            accountCode: item.accountCode,
          },
        },
      });

      if (!acc) {
        throw new NotFoundException(
          `Account code ${item.accountCode} not found in chart of accounts`,
        );
      }

      let fundId: string | null = null;
      if (item.fundCode) {
        const fund = await this.prisma.fund.findUnique({
          where: {
            accountingEntityId_code: {
              accountingEntityId: data.accountingEntityId,
              code: item.fundCode,
            },
          },
        });
        if (fund) fundId = fund.id;
      }

      let costCenterId: string | null = null;
      if (item.costCenterCode) {
        const cc = await this.prisma.costCenter.findUnique({
          where: {
            accountingEntityId_code: {
              accountingEntityId: data.accountingEntityId,
              code: item.costCenterCode,
            },
          },
        });
        if (cc) costCenterId = cc.id;
      }

      const dr = Number(item.debitAmount) || 0;
      const cr = Number(item.creditAmount) || 0;
      totalDr += dr;
      totalCr += cr;

      linesInput.push({
        accountId: acc.id,
        description: item.description || `Opening Balance for ${acc.name}`,
        debitAmount: dr,
        creditAmount: cr,
        fundId,
        costCenterId,
      });
    }

    if (Math.abs(totalDr - totalCr) >= 0.001) {
      throw new BadRequestException(
        `Opening Balances must balance: Total Debits (${totalDr.toFixed(2)}) != Total Credits (${totalCr.toFixed(2)})`,
      );
    }

    const journal = await this.createDraft(
      {
        accountingEntityId: data.accountingEntityId,
        journalType: 'OPENING',
        journalDate: asOfDate,
        description: `Migration Opening Balances as of ${asOfDate.toISOString().split('T')[0]}`,
        reference: 'MIGRATION_OB',
        lines: linesInput,
      },
      actor,
    );

    const posted = await this.postingService.postJournal({
      accountingEntityId: data.accountingEntityId,
      journalEntryId: journal.id,
      actor,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_OPENING_BALANCE_POSTED ??
          'finance.opening_balance.posted.v1',
        { totalDebit: totalDr, totalCredit: totalCr },
        {
          organizationId: data.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return posted;
  }

  async getJournal(id: string) {
    const j = await this.journalRepo.findById(id);
    if (!j) throw new NotFoundException('Journal entry not found');
    return j;
  }

  async listJournals(params: {
    accountingEntityId: string;
    status?: any;
    journalType?: any;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    return this.journalRepo.findMany(params);
  }
}
