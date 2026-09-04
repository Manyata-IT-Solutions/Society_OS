function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}
import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor } from '@community-os/types';
import { Prisma } from '@prisma/client';

export interface PostingRequest {
  accountingEntityId: string;
  journalEntryId: string;
  actor: Actor;
}

@Injectable()
export class FinancialPostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async postJournal(request: PostingRequest) {
    const { accountingEntityId, journalEntryId, actor } = request;

    return this.prisma.$transaction(async (tx) => {
      const journal = await tx.journalEntry.findUnique({
        where: { id: journalEntryId },
        include: {
          lines: {
            include: {
              account: true,
              costCenter: true,
              fund: true,
            },
          },
          accountingEntity: true,
          fiscalYear: true,
          accountingPeriod: true,
        },
      });

      if (!journal) {
        throw new NotFoundException('Journal entry not found');
      }

      if (journal.accountingEntityId !== accountingEntityId) {
        throw new BadRequestException('Journal does not belong to the specified Accounting Entity');
      }

      if (journal.status === 'POSTED') {
        throw new ConflictException('Journal is already posted');
      }

      if (journal.status === 'CANCELLED' || journal.status === 'REVERSED') {
        throw new BadRequestException(`Cannot post journal with status ${journal.status}`);
      }

      if (journal.accountingEntity.status !== 'ACTIVE') {
        throw new BadRequestException('Accounting Entity is not ACTIVE');
      }

      const period = journal.accountingPeriod;
      if (period.status === 'HARD_CLOSED') {
        throw new BadRequestException(
          `Fiscal period ${period.name} is HARD_CLOSED. Posting is strictly prohibited.`,
        );
      }

      if (
        period.status === 'SOFT_CLOSED' &&
        journal.journalType !== 'ADJUSTMENT' &&
        journal.journalType !== 'REVERSAL'
      ) {
        throw new BadRequestException(
          `Fiscal period ${period.name} is SOFT_CLOSED. Only adjustment and reversal entries are permitted.`,
        );
      }

      if (journal.fiscalYear.status === 'CLOSED') {
        throw new BadRequestException(`Fiscal Year ${journal.fiscalYear.name} is CLOSED.`);
      }

      if (!journal.lines || journal.lines.length < 2) {
        throw new BadRequestException('Journal entry must contain at least 2 lines');
      }

      let totalDr = 0;
      let totalCr = 0;

      for (const line of journal.lines) {
        const dr = Number(line.debitAmount);
        const cr = Number(line.creditAmount);

        if (dr < 0 || cr < 0) {
          throw new BadRequestException(
            `Line ${line.lineNumber}: Negative amounts are not allowed`,
          );
        }

        if ((dr === 0 && cr === 0) || (dr > 0 && cr > 0)) {
          throw new BadRequestException(
            `Line ${line.lineNumber}: Exactly one of debit or credit must be positive`,
          );
        }

        if (line.account.accountingEntityId !== accountingEntityId) {
          throw new BadRequestException(
            `Line ${line.lineNumber}: Account ${line.account.accountCode} belongs to a different accounting entity`,
          );
        }

        if (line.account.status !== 'ACTIVE') {
          throw new BadRequestException(
            `Line ${line.lineNumber}: Account ${line.account.accountCode} is not ACTIVE`,
          );
        }

        if (!line.account.postingAllowed) {
          throw new BadRequestException(
            `Line ${line.lineNumber}: Account ${line.account.accountCode} is a header/non-posting account`,
          );
        }

        if (
          line.account.isControlAccount &&
          !line.account.allowManualPosting &&
          journal.journalType === 'GENERAL'
        ) {
          throw new BadRequestException(
            `Line ${line.lineNumber}: Account ${line.account.accountCode} is a control account restricted from direct manual posting`,
          );
        }

        totalDr += dr;
        totalCr += cr;
      }

      const diff = Math.abs(totalDr - totalCr);
      if (diff >= 0.001) {
        throw new BadRequestException(
          `Journal is unbalanced. Total Debits: ${totalDr.toFixed(2)}, Total Credits: ${totalCr.toFixed(2)}, Difference: ${diff.toFixed(2)}`,
        );
      }

      const now = new Date();

      const updatedJournal = await tx.journalEntry.update({
        where: { id: journal.id },
        data: {
          status: 'POSTED',
          postedAt: now,
          postedByUser:
            actor?.userId && isValidUuid(actor.userId)
              ? { connect: { id: actor.userId } }
              : actor?.id && isValidUuid(actor.id)
                ? { connect: { id: actor.id } }
                : undefined,
          totalDebit: new Prisma.Decimal(totalDr),
          totalCredit: new Prisma.Decimal(totalCr),
        },
      });

      for (const line of journal.lines) {
        await tx.generalLedgerEntry.create({
          data: {
            accountingEntityId,
            journalEntryId: journal.id,
            journalLineId: line.id,
            accountId: line.accountId,
            postingDate: journal.journalDate,
            fiscalYearId: journal.fiscalYearId,
            periodId: journal.accountingPeriodId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            baseAmount: line.baseAmount,
            costCenterId: line.costCenterId,
            fundId: line.fundId,
            sourceModule: journal.sourceModule,
            sourceType: journal.sourceType,
            sourceId: journal.sourceId,
            postedAt: now,
          },
        });

        const dr = Number(line.debitAmount);
        const cr = Number(line.creditAmount);

        const existingBalance = await tx.accountBalance.findFirst({
          where: {
            accountingEntityId,
            accountId: line.accountId,
            fiscalYearId: journal.fiscalYearId,
            periodId: journal.accountingPeriodId,
            fundId: line.fundId ?? null,
            costCenterId: line.costCenterId ?? null,
          },
        });

        if (existingBalance) {
          const newPeriodDr = Number(existingBalance.periodDebit) + dr;
          const newPeriodCr = Number(existingBalance.periodCredit) + cr;
          const newClosingDr = Number(existingBalance.openingDebit) + newPeriodDr;
          const newClosingCr = Number(existingBalance.openingCredit) + newPeriodCr;

          await tx.accountBalance.update({
            where: { id: existingBalance.id },
            data: {
              periodDebit: new Prisma.Decimal(newPeriodDr),
              periodCredit: new Prisma.Decimal(newPeriodCr),
              closingDebit: new Prisma.Decimal(newClosingDr),
              closingCredit: new Prisma.Decimal(newClosingCr),
              updatedAt: now,
            },
          });
        } else {
          await tx.accountBalance.create({
            data: {
              accountingEntityId,
              accountId: line.accountId,
              fiscalYearId: journal.fiscalYearId,
              periodId: journal.accountingPeriodId,
              fundId: line.fundId ?? null,
              costCenterId: line.costCenterId ?? null,
              openingDebit: new Prisma.Decimal(0),
              openingCredit: new Prisma.Decimal(0),
              periodDebit: new Prisma.Decimal(dr),
              periodCredit: new Prisma.Decimal(cr),
              closingDebit: new Prisma.Decimal(dr),
              closingCredit: new Prisma.Decimal(cr),
              updatedAt: now,
            },
          });
        }
      }

      this.eventsService.publish(
        createEvent(
          (DOMAIN_EVENTS as any).FINANCE_JOURNAL_POSTED ?? 'finance.journal.posted.v1',
          {
            journalNumber: journal.journalNumber,
            journalType: journal.journalType,
            totalDebit: totalDr,
            totalCredit: totalCr,
            postedAt: now.toISOString(),
          },
          {
            organizationId: journal.accountingEntity.organizationId,
            communityId: journal.accountingEntity.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return updatedJournal;
    });
  }
}
