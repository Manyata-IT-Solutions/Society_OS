import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BankStatement, BankTransaction } from '@prisma/client';
import crypto from 'crypto';

@Injectable()
export class BankStatementImportService {
  constructor(private readonly prisma: PrismaService) {}

  generateFingerprint(
    bankAccountId: string,
    txn: {
      transactionDate: string;
      amount: number;
      direction: string;
      description: string;
      bankReference?: string | null;
    },
  ): string {
    const normDate = new Date(txn.transactionDate).toISOString().slice(0, 10);
    const normDesc = (txn.description || '').trim().toUpperCase().replace(/\s+/g, ' ');
    const normRef = (txn.bankReference || '').trim().toUpperCase();
    const raw = `${bankAccountId}|${normDate}|${txn.amount.toFixed(2)}|${txn.direction}|${normRef}|${normDesc}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async importStatement(data: {
    bankAccountId: string;
    statementReference: string;
    periodStart: string;
    periodEnd: string;
    openingBalance: number;
    closingBalance: number;
    currency?: string;
    importSource?: string;
    transactions: Array<{
      transactionDate: string;
      valueDate?: string;
      description: string;
      bankReference?: string | null;
      amount: number;
      direction: 'DEBIT' | 'CREDIT';
      runningBalance?: number;
    }>;
  }): Promise<{ statement: BankStatement; importedCount: number; duplicateCount: number }> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: data.bankAccountId },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    // Create or find statement
    let statement = await this.prisma.bankStatement.findUnique({
      where: {
        bankAccountId_statementReference: {
          bankAccountId: data.bankAccountId,
          statementReference: data.statementReference,
        },
      },
    });

    if (!statement) {
      statement = await this.prisma.bankStatement.create({
        data: {
          bankAccount: { connect: { id: data.bankAccountId } },
          statementReference: data.statementReference,
          periodStart: new Date(data.periodStart),
          periodEnd: new Date(data.periodEnd),
          openingBalance: data.openingBalance,
          closingBalance: data.closingBalance,
          currency: data.currency || bankAccount.currency || 'INR',
          importSource: data.importSource || 'CSV',
          status: 'PARSED',
        },
      });
    }

    let importedCount = 0;
    let duplicateCount = 0;

    for (const txn of data.transactions) {
      const fingerprint = this.generateFingerprint(data.bankAccountId, txn);

      const existingTxn = await this.prisma.bankTransaction.findUnique({
        where: {
          bankAccountId_fingerprint: {
            bankAccountId: data.bankAccountId,
            fingerprint,
          },
        },
      });

      if (existingTxn) {
        duplicateCount++;
        continue;
      }

      await this.prisma.bankTransaction.create({
        data: {
          bankStatement: { connect: { id: statement.id } },
          bankAccount: { connect: { id: data.bankAccountId } },
          transactionDate: new Date(txn.transactionDate),
          valueDate: txn.valueDate ? new Date(txn.valueDate) : undefined,
          description: txn.description,
          bankReference: txn.bankReference || undefined,
          amount: txn.amount,
          direction: txn.direction,
          runningBalance: txn.runningBalance !== undefined ? txn.runningBalance : undefined,
          status: 'UNMATCHED',
          fingerprint,
        },
      });
      importedCount++;
    }

    return { statement, importedCount, duplicateCount };
  }

  async listStatements(bankAccountId: string): Promise<BankStatement[]> {
    return this.prisma.bankStatement.findMany({
      where: { bankAccountId },
      include: { transactions: true },
      orderBy: { importedAt: 'desc' },
    });
  }

  async listTransactions(
    bankAccountId: string,
    filters?: { status?: any; startDate?: Date; endDate?: Date },
  ): Promise<BankTransaction[]> {
    return this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId,
        status: filters?.status,
        transactionDate: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }
}
