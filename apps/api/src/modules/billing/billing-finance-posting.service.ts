import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { FinancialPostingService } from '../finance/financial-posting.service.js';
import { FinancialSequenceService } from '../finance/financial-sequence.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class BillingFinancePostingService {
  private readonly logger = new Logger(BillingFinancePostingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financePosting: FinancialPostingService,
    private readonly financeSequence: FinancialSequenceService,
  ) {}

  async postInvoiceIssue(invoiceId: string, actor?: any): Promise<string | null> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          billableAccount: { include: { unit: true } },
          lines: { include: { chargeDefinition: true, fund: true, costCenter: true } },
        },
      });

      if (!invoice) return null;

      const entity = await this.prisma.accountingEntity.findFirst({
        where: { communityId: invoice.communityId, status: 'ACTIVE' },
      });
      if (!entity) return null;

      const arAccount =
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, systemAccountKey: 'AR_CONTROL' },
        })) ||
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, accountCode: '1110' },
        }));

      const incomeAccount =
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, systemAccountKey: 'MAINTENANCE_INCOME' },
        })) ||
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, accountCode: '4100' },
        }));

      if (!arAccount || !incomeAccount) return null;

      const openPeriod = await this.prisma.accountingPeriod.findFirst({
        where: {
          fiscalYear: { accountingEntityId: entity.id },
          status: { not: 'HARD_CLOSED' },
        },
        include: { fiscalYear: true },
      });

      if (!openPeriod) return null;

      const journalNumber = await this.financeSequence.getNextNumber(entity.id, 'SYSTEM');
      const grandTotal = Number(invoice.grandTotal);
      const journalLines: any[] = [
        {
          lineNumber: 1,
          accountId: arAccount.id,
          description: `AR - Invoice ${invoice.invoiceNumber}`,
          debitAmount: new Prisma.Decimal(grandTotal),
          creditAmount: new Prisma.Decimal(0),
          baseAmount: new Prisma.Decimal(grandTotal),
          partyType: 'CUSTOMER',
          partyId: invoice.billableAccountId,
        },
      ];

      let lineNum = 2;
      for (const l of invoice.lines) {
        const net = Number(l.netAmount);
        journalLines.push({
          lineNumber: lineNum++,
          accountId: incomeAccount.id,
          description: l.descriptionSnapshot,
          debitAmount: new Prisma.Decimal(0),
          creditAmount: new Prisma.Decimal(net),
          baseAmount: new Prisma.Decimal(net),
          fundId: l.fundId || undefined,
          costCenterId: l.costCenterId || undefined,
        });
      }

      const journal = await this.prisma.journalEntry.create({
        data: {
          accountingEntity: { connect: { id: entity.id } },
          fiscalYear: { connect: { id: openPeriod.fiscalYearId } },
          accountingPeriod: { connect: { id: openPeriod.id } },
          journalNumber,
          journalType: 'GENERAL',
          journalDate: invoice.invoiceDate,
          status: 'APPROVED',
          currency: invoice.currency,
          description: `Maintenance Billing - Invoice ${invoice.invoiceNumber}`,
          sourceModule: 'BILLING',
          sourceType: 'INVOICE',
          sourceId: invoice.id,
          postingPurpose: 'invoice.issue',
          totalDebit: new Prisma.Decimal(grandTotal),
          totalCredit: new Prisma.Decimal(grandTotal),
          lines: { create: journalLines },
        },
      });

      const posted = await this.financePosting.postJournal({
        accountingEntityId: entity.id,
        journalEntryId: journal.id,
        actor,
      });

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { financeJournalId: posted.id },
      });

      return posted.id;
    } catch (err: any) {
      this.logger.warn(`Failed to post invoice issue to GL: ${err.message}`);
      return null;
    }
  }

  async postPaymentReceive(paymentId: string, actor?: any): Promise<string | null> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { billableAccount: true },
      });
      if (!payment) return null;

      const entity = await this.prisma.accountingEntity.findFirst({
        where: { communityId: payment.communityId, status: 'ACTIVE' },
      });
      if (!entity) return null;

      const bankAccount =
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, accountCode: '1120' },
        })) ||
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, accountType: 'ASSET' },
        }));

      const arAccount =
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, systemAccountKey: 'AR_CONTROL' },
        })) ||
        (await this.prisma.ledgerAccount.findFirst({
          where: { accountingEntityId: entity.id, accountCode: '1110' },
        }));

      if (!bankAccount || !arAccount) return null;

      const openPeriod = await this.prisma.accountingPeriod.findFirst({
        where: {
          fiscalYear: { accountingEntityId: entity.id },
          status: { not: 'HARD_CLOSED' },
        },
        include: { fiscalYear: true },
      });
      if (!openPeriod) return null;

      const journalNumber = await this.financeSequence.getNextNumber(entity.id, 'SYSTEM');
      const amount = Number(payment.receivedAmount);

      const journal = await this.prisma.journalEntry.create({
        data: {
          accountingEntity: { connect: { id: entity.id } },
          fiscalYear: { connect: { id: openPeriod.fiscalYearId } },
          accountingPeriod: { connect: { id: openPeriod.id } },
          journalNumber,
          journalType: 'GENERAL',
          journalDate: payment.paymentDate,
          status: 'APPROVED',
          currency: payment.currency,
          description: `Payment Receipt - ${payment.paymentNumber}`,
          sourceModule: 'BILLING',
          sourceType: 'PAYMENT',
          sourceId: payment.id,
          postingPurpose: 'payment.receive',
          totalDebit: new Prisma.Decimal(amount),
          totalCredit: new Prisma.Decimal(amount),
          lines: {
            create: [
              {
                lineNumber: 1,
                accountId: bankAccount.id,
                description: `Bank Receipt - ${payment.paymentMethod}`,
                debitAmount: new Prisma.Decimal(amount),
                creditAmount: new Prisma.Decimal(0),
                baseAmount: new Prisma.Decimal(amount),
              },
              {
                lineNumber: 2,
                accountId: arAccount.id,
                description: `AR Credit - ${payment.paymentNumber}`,
                debitAmount: new Prisma.Decimal(0),
                creditAmount: new Prisma.Decimal(amount),
                baseAmount: new Prisma.Decimal(amount),
                partyType: 'CUSTOMER',
                partyId: payment.billableAccountId,
              },
            ],
          },
        },
      });

      const posted = await this.financePosting.postJournal({
        accountingEntityId: entity.id,
        journalEntryId: journal.id,
        actor,
      });

      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { financeJournalId: posted.id },
      });

      return posted.id;
    } catch (err: any) {
      this.logger.warn(`Failed to post payment receive to GL: ${err.message}`);
      return null;
    }
  }
}
