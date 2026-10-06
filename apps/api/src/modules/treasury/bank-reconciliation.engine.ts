function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { FinancialPostingService } from '../finance/financial-posting.service.js';
import { FinancialSequenceService } from '../finance/financial-sequence.service.js';
import { BankReconciliationSession, BankMatch } from '@prisma/client';

@Injectable()
export class BankReconciliationEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialPosting: FinancialPostingService,
    private readonly finSequence: FinancialSequenceService,
  ) {}

  async createSession(
    data: {
      bankAccountId: string;
      statementId?: string;
      periodStart: string;
      periodEnd: string;
      statementOpeningBalance?: number;
      statementClosingBalance?: number;
    },
    actor?: any,
  ): Promise<BankReconciliationSession> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: data.bankAccountId },
      include: { glAccount: true },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const sessionCount = await this.prisma.bankReconciliationSession.count({
      where: { bankAccountId: data.bankAccountId },
    });
    const sessionNumber = `RECON-${new Date().getFullYear()}-${String(sessionCount + 1).padStart(4, '0')}`;

    // Calculate book opening & closing balance from GL
    const pStart = new Date(data.periodStart);
    const pEnd = new Date(data.periodEnd);

    const priorGlEntries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        accountId: bankAccount.glAccountId,
        postingDate: { lt: pStart },
      },
    });
    const bookOpeningBalance = priorGlEntries.reduce(
      (sum, e) => sum + (Number(e.debitAmount) - Number(e.creditAmount)),
      0,
    );

    const periodGlEntries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        accountId: bankAccount.glAccountId,
        postingDate: { lte: pEnd },
      },
    });
    const bookClosingBalance = periodGlEntries.reduce(
      (sum, e) => sum + (Number(e.debitAmount) - Number(e.creditAmount)),
      0,
    );

    const stmtClose =
      data.statementClosingBalance !== undefined
        ? data.statementClosingBalance
        : bookClosingBalance;
    const diff = Math.abs(stmtClose - bookClosingBalance);
    const userId = actor?.userId || actor?.id;

    return this.prisma.bankReconciliationSession.create({
      data: {
        bankAccount: { connect: { id: data.bankAccountId } },
        statement: data.statementId ? { connect: { id: data.statementId } } : undefined,
        sessionNumber,
        periodStart: pStart,
        periodEnd: pEnd,
        bookOpeningBalance,
        statementOpeningBalance: data.statementOpeningBalance || bookOpeningBalance,
        bookClosingBalance,
        statementClosingBalance: stmtClose,
        difference: diff,
        status: 'IN_PROGRESS',
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });
  }

  async runAutoMatch(sessionId: string): Promise<{ matchedCount: number; matches: BankMatch[] }> {
    const session = await this.prisma.bankReconciliationSession.findUnique({
      where: { id: sessionId },
      include: { bankAccount: true },
    });
    if (!session) throw new NotFoundException('Reconciliation session not found');

    const unmatchedTxns = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId: session.bankAccountId,
        status: 'UNMATCHED',
        transactionDate: {
          gte: session.periodStart,
          lte: session.periodEnd,
        },
      },
    });

    let matchedCount = 0;
    const results: BankMatch[] = [];

    for (const txn of unmatchedTxns) {
      const amt = Number(txn.amount);

      if (txn.direction === 'DEBIT') {
        // Find matching Vendor Payment (exact amount and near date)
        const vPayment = await this.prisma.vendorPayment.findFirst({
          where: {
            bankAccountId: session.bankAccountId,
            amount: amt,
            status: 'SUCCESS',
            bankMatches: { none: {} },
          },
        });

        if (vPayment) {
          const match = await this.prisma.$transaction(async (prisma) => {
            const m = await prisma.bankMatch.create({
              data: {
                session: { connect: { id: sessionId } },
                bankTransaction: { connect: { id: txn.id } },
                vendorPayment: { connect: { id: vPayment.id } },
                matchConfidence: 'EXACT',
                matchType: 'AUTO',
                matchedAmount: amt,
              },
            });
            await prisma.bankTransaction.update({
              where: { id: txn.id },
              data: { status: 'AUTO_MATCHED' },
            });
            return m;
          });
          matchedCount++;
          results.push(match);
        }
      } else if (txn.direction === 'CREDIT') {
        // Find matching Phase 14 Resident Payment
        const rPayment = await this.prisma.payment.findFirst({
          where: {
            receivedAmount: amt,
            status: 'SUCCESS',
            bankMatches: { none: {} },
          },
        });

        if (rPayment) {
          const match = await this.prisma.$transaction(async (prisma) => {
            const m = await prisma.bankMatch.create({
              data: {
                session: { connect: { id: sessionId } },
                bankTransaction: { connect: { id: txn.id } },
                residentPayment: { connect: { id: rPayment.id } },
                matchConfidence: 'EXACT',
                matchType: 'AUTO',
                matchedAmount: amt,
              },
            });
            await prisma.bankTransaction.update({
              where: { id: txn.id },
              data: { status: 'AUTO_MATCHED' },
            });
            return m;
          });
          matchedCount++;
          results.push(match);
        }
      }
    }

    return { matchedCount, matches: results };
  }

  async manualMatch(
    data: {
      sessionId: string;
      bankTransactionId: string;
      matchedEntityType: 'VENDOR_PAYMENT' | 'RESIDENT_PAYMENT' | 'JOURNAL_ENTRY';
      matchedEntityId: string;
      notes?: string;
    },
    actor?: any,
  ): Promise<BankMatch> {
    const txn = await this.prisma.bankTransaction.findUnique({
      where: { id: data.bankTransactionId },
    });
    if (!txn) throw new NotFoundException('Bank transaction not found');
    if (txn.status !== 'UNMATCHED') throw new BadRequestException('Transaction is already matched');

    const amt = Number(txn.amount);
    const userId = actor?.userId || actor?.id;

    return this.prisma.$transaction(async (prisma) => {
      const match = await prisma.bankMatch.create({
        data: {
          session: { connect: { id: data.sessionId } },
          bankTransaction: { connect: { id: data.bankTransactionId } },
          vendorPayment:
            data.matchedEntityType === 'VENDOR_PAYMENT'
              ? { connect: { id: data.matchedEntityId } }
              : undefined,
          residentPayment:
            data.matchedEntityType === 'RESIDENT_PAYMENT'
              ? { connect: { id: data.matchedEntityId } }
              : undefined,
          journalEntry:
            data.matchedEntityType === 'JOURNAL_ENTRY'
              ? { connect: { id: data.matchedEntityId } }
              : undefined,
          matchConfidence: 'HIGH',
          matchType: 'MANUAL',
          matchedAmount: amt,
          notes: data.notes,
          createdById: isValidUuid(userId) ? userId : undefined,
        },
      });

      await prisma.bankTransaction.update({
        where: { id: data.bankTransactionId },
        data: { status: 'MANUALLY_MATCHED' },
      });

      return match;
    });
  }

  async postBankFeeJournal(
    data: {
      sessionId: string;
      bankTransactionId: string;
      expenseAccountId: string;
      description: string;
      costCenterId?: string;
      fundId?: string;
    },
    actor: any,
  ): Promise<BankMatch> {
    const txn = await this.prisma.bankTransaction.findUnique({
      where: { id: data.bankTransactionId },
      include: { bankAccount: true },
    });
    if (!txn) throw new NotFoundException('Bank transaction not found');
    if (txn.status !== 'UNMATCHED') throw new BadRequestException('Transaction is already matched');

    const entityId = txn.bankAccount.accountingEntityId;
    const amount = Number(txn.amount);

    let period = await this.prisma.accountingPeriod.findFirst({
      where: {
        fiscalYear: { accountingEntityId: entityId },
        startDate: { lte: txn.transactionDate },
        endDate: { gte: txn.transactionDate },
      },
      include: { fiscalYear: true },
    });
    if (!period) {
      period = await this.prisma.accountingPeriod.findFirst({
        where: { fiscalYear: { accountingEntityId: entityId } },
        include: { fiscalYear: true },
      });
    }
    if (!period) throw new Error('Open fiscal period not found');

    const journalNumber = await this.finSequence.getNextNumber(entityId, 'JOURNAL');

    const journal = await this.prisma.journalEntry.create({
      data: {
        accountingEntity: { connect: { id: entityId } },
        fiscalYear: { connect: { id: period.fiscalYearId } },
        accountingPeriod: { connect: { id: period.id } },
        journalNumber,
        journalType: 'SYSTEM',
        journalDate: txn.transactionDate,
        status: 'DRAFT',
        description: `Bank Charges - ${data.description}`,
        reference: txn.bankReference || txn.description,
        sourceModule: 'TREASURY',
        sourceType: 'BANK_FEE',
        sourceId: txn.id,
        postingPurpose: 'bank_fee.post',
        currency: txn.bankAccount.currency,
        totalDebit: amount,
        totalCredit: amount,
        lines: {
          create: [
            {
              lineNumber: 1,
              accountId: data.expenseAccountId,
              description: data.description,
              debitAmount: amount,
              creditAmount: 0,
              baseAmount: amount,
              costCenterId: data.costCenterId || undefined,
              fundId: data.fundId || undefined,
            },
            {
              lineNumber: 2,
              accountId: txn.bankAccount.glAccountId,
              description: `Bank charge deduction ${txn.bankReference || ''}`,
              debitAmount: 0,
              creditAmount: amount,
              baseAmount: amount,
            },
          ],
        },
      },
    });

    await this.financialPosting.postJournal({
      accountingEntityId: entityId,
      journalEntryId: journal.id,
      actor,
    });

    // Match transaction to this journal
    return this.manualMatch(
      {
        sessionId: data.sessionId,
        bankTransactionId: txn.id,
        matchedEntityType: 'JOURNAL_ENTRY',
        matchedEntityId: journal.id,
        notes: 'Matched with posted Bank Fee Journal',
      },
      actor,
    );
  }

  async completeSession(
    sessionId: string,
    actor: any,
    allowDifferenceOverride: boolean = false,
    overrideReason?: string,
  ): Promise<BankReconciliationSession> {
    const session = await this.prisma.bankReconciliationSession.findUnique({
      where: { id: sessionId },
      include: { bankAccount: true },
    });
    if (!session) throw new NotFoundException('Reconciliation session not found');

    const _remainingUnmatched = await this.prisma.bankTransaction.count({
      where: {
        bankAccountId: session.bankAccountId,
        status: 'UNMATCHED',
        transactionDate: {
          gte: session.periodStart,
          lte: session.periodEnd,
        },
      },
    });

    const diff = Number(session.difference);
    if (diff > 0.01 && !allowDifferenceOverride) {
      throw new BadRequestException(
        `Cannot complete reconciliation with unreconciled difference of ₹${diff.toFixed(2)}`,
      );
    }

    const userId = actor?.userId || actor?.id;

    return this.prisma.bankReconciliationSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedById: isValidUuid(userId) ? userId : undefined,
        completedAt: new Date(),
        notes: overrideReason || session.notes,
      },
      include: { matches: true },
    });
  }

  async reopenSession(
    sessionId: string,
    reason: string,
    actor: any,
  ): Promise<BankReconciliationSession> {
    const session = await this.prisma.bankReconciliationSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Reconciliation session not found');

    const userId = actor?.userId || actor?.id;

    return this.prisma.bankReconciliationSession.update({
      where: { id: sessionId },
      data: {
        status: 'REOPENED',
        reopenedById: isValidUuid(userId) ? userId : undefined,
        reopenedAt: new Date(),
        reopenReason: reason,
      },
    });
  }

  async getSessionById(id: string): Promise<any> {
    return this.prisma.bankReconciliationSession.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        statement: true,
        matches: {
          include: {
            bankTransaction: true,
            vendorPayment: true,
            residentPayment: true,
            journalEntry: true,
          },
        },
      },
    });
  }
}
