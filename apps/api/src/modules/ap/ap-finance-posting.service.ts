import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { FinancialPostingService } from '../finance/financial-posting.service.js';
import { FinancialSequenceService } from '../finance/financial-sequence.service.js';
import type { Actor } from '@community-os/types';

@Injectable()
export class ApFinancePostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialPosting: FinancialPostingService,
    private readonly finSequence: FinancialSequenceService,
  ) {}

  async postSupplierInvoice(supplierInvoiceId: string, actor: Actor): Promise<string> {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: supplierInvoiceId },
      include: {
        lines: true,
        accountingEntity: true,
      },
    });

    if (!invoice) throw new Error('Supplier invoice not found');
    if (invoice.postingJournalId) return invoice.postingJournalId;

    const entityId = invoice.accountingEntityId;

    // Find AP Control Account (2110 or systemAccountKey AP_CONTROL)
    const apControlAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountingEntityId: entityId,
        OR: [{ systemAccountKey: 'AP_CONTROL' }, { accountCode: '2100' }, { accountCode: '2110' }],
      },
    });
    if (!apControlAccount) throw new Error('AP Control ledger account not configured');

    // Find default Expense / Inventory Account (5100, 1200 or systemAccountKey EXPENSE)
    const expenseAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountingEntityId: entityId,
        OR: [
          { systemAccountKey: 'MAINTENANCE_EXPENSE' },
          { accountCode: '5100' },
          { accountCode: '5200' },
          { accountType: 'EXPENSE', postingAllowed: true },
        ],
      },
    });
    if (!expenseAccount) throw new Error('Expense/Inventory ledger account not configured');

    // Find active fiscal period
    const invoiceDate = invoice.invoiceDate;
    let period = await this.prisma.accountingPeriod.findFirst({
      where: {
        fiscalYear: { accountingEntityId: entityId },
        startDate: { lte: invoiceDate },
        endDate: { gte: invoiceDate },
      },
      include: { fiscalYear: true },
    });
    if (!period) {
      period = await this.prisma.accountingPeriod.findFirst({
        where: { fiscalYear: { accountingEntityId: entityId } },
        include: { fiscalYear: true },
      });
    }
    if (!period) throw new Error('Open fiscal period not found for invoice date');

    const journalNumber = await this.finSequence.getNextNumber(entityId, 'JOURNAL');
    const grandTotal = Number(invoice.grandTotal);

    const journal = await this.prisma.journalEntry.create({
      data: {
        accountingEntity: { connect: { id: entityId } },
        fiscalYear: { connect: { id: period.fiscalYearId } },
        accountingPeriod: { connect: { id: period.id } },
        journalNumber,
        journalType: 'SYSTEM',
        journalDate: invoice.invoiceDate,
        status: 'DRAFT',
        description: `Supplier Invoice ${invoice.supplierInvoiceNumber} (${invoice.internalInvoiceNumber})`,
        reference: invoice.internalInvoiceNumber,
        sourceModule: 'AP',
        sourceType: 'SUPPLIER_INVOICE',
        sourceId: invoice.id,
        postingPurpose: 'supplier_invoice.post',
        currency: invoice.currency,
        totalDebit: grandTotal,
        totalCredit: grandTotal,
        lines: {
          create: [
            {
              lineNumber: 1,
              accountId: expenseAccount.id,
              description: `Expense for Invoice ${invoice.supplierInvoiceNumber}`,
              debitAmount: grandTotal,
              creditAmount: 0,
              baseAmount: grandTotal,
              costCenterId: invoice.lines[0]?.costCenterId || undefined,
              fundId: invoice.lines[0]?.fundId || undefined,
              partyType: 'VENDOR',
              partyId: invoice.vendorId,
            },
            {
              lineNumber: 2,
              accountId: apControlAccount.id,
              description: `AP Liability for Invoice ${invoice.supplierInvoiceNumber}`,
              debitAmount: 0,
              creditAmount: grandTotal,
              baseAmount: grandTotal,
              partyType: 'VENDOR',
              partyId: invoice.vendorId,
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

    await this.prisma.supplierInvoice.update({
      where: { id: invoice.id },
      data: { postingJournalId: journal.id },
    });

    return journal.id;
  }

  async postVendorPayment(paymentId: string, actor: Actor): Promise<string> {
    const payment = await this.prisma.vendorPayment.findUnique({
      where: { id: paymentId },
      include: {
        vendorAccount: true,
        bankAccount: true,
      },
    });

    if (!payment) throw new Error('Vendor payment not found');
    if (payment.postingJournalId) return payment.postingJournalId;

    const entityId = payment.accountingEntityId;

    const apControlAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountingEntityId: entityId,
        OR: [{ systemAccountKey: 'AP_CONTROL' }, { accountCode: '2100' }, { accountCode: '2110' }],
      },
    });
    if (!apControlAccount) throw new Error('AP Control ledger account not configured');

    let bankGlAccountId = payment.bankAccount?.glAccountId;
    if (!bankGlAccountId) {
      const defaultBank = await this.prisma.ledgerAccount.findFirst({
        where: {
          accountingEntityId: entityId,
          OR: [
            { systemAccountKey: 'CASH_AND_BANK' },
            { accountCode: '1120' },
            { accountType: 'ASSET' },
          ],
        },
      });
      bankGlAccountId = defaultBank?.id;
    }
    if (!bankGlAccountId) throw new Error('Bank GL account not configured');

    const paymentDate = payment.paymentDate;
    let period = await this.prisma.accountingPeriod.findFirst({
      where: {
        fiscalYear: { accountingEntityId: entityId },
        startDate: { lte: paymentDate },
        endDate: { gte: paymentDate },
      },
      include: { fiscalYear: true },
    });
    if (!period) {
      period = await this.prisma.accountingPeriod.findFirst({
        where: { fiscalYear: { accountingEntityId: entityId } },
        include: { fiscalYear: true },
      });
    }
    if (!period) throw new Error('Open fiscal period not found for payment date');

    const journalNumber = await this.finSequence.getNextNumber(entityId, 'JOURNAL');
    const amount = Number(payment.amount);

    const journal = await this.prisma.journalEntry.create({
      data: {
        accountingEntity: { connect: { id: entityId } },
        fiscalYear: { connect: { id: period.fiscalYearId } },
        accountingPeriod: { connect: { id: period.id } },
        journalNumber,
        journalType: 'SYSTEM',
        journalDate: payment.paymentDate,
        status: 'DRAFT',
        description: `Vendor Payment ${payment.paymentNumber} (${payment.paymentMethod})`,
        reference: payment.paymentNumber,
        sourceModule: 'AP',
        sourceType: 'VENDOR_PAYMENT',
        sourceId: payment.id,
        postingPurpose: 'vendor_payment.post',
        currency: payment.currency,
        totalDebit: amount,
        totalCredit: amount,
        lines: {
          create: [
            {
              lineNumber: 1,
              accountId: apControlAccount.id,
              description: `Discharge AP Liability - Payment ${payment.paymentNumber}`,
              debitAmount: amount,
              creditAmount: 0,
              baseAmount: amount,
              partyType: 'VENDOR',
              partyId: payment.vendorAccount.vendorId,
            },
            {
              lineNumber: 2,
              accountId: bankGlAccountId,
              description: `Bank Payment ${payment.paymentNumber}`,
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

    await this.prisma.vendorPayment.update({
      where: { id: payment.id },
      data: { postingJournalId: journal.id },
    });

    return journal.id;
  }

  async postVendorAdvance(advanceId: string, actor: Actor): Promise<string> {
    const advance = await this.prisma.vendorAdvance.findUnique({
      where: { id: advanceId },
      include: { vendorAccount: true, bankAccount: true },
    });
    if (!advance) throw new Error('Vendor advance not found');
    if (advance.postingJournalId) return advance.postingJournalId;

    const entityId = advance.accountingEntityId;

    const advanceAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountingEntityId: entityId,
        OR: [
          { systemAccountKey: 'VENDOR_ADVANCE' },
          { accountCode: '1300' },
          { accountCode: '1130' },
        ],
      },
    });
    if (!advanceAccount) throw new Error('Vendor Advance ledger account not configured');

    let bankGlAccountId = advance.bankAccount?.glAccountId;
    if (!bankGlAccountId) {
      const defaultBank = await this.prisma.ledgerAccount.findFirst({
        where: {
          accountingEntityId: entityId,
          OR: [{ systemAccountKey: 'CASH_AND_BANK' }, { accountCode: '1120' }],
        },
      });
      bankGlAccountId = defaultBank?.id;
    }
    if (!bankGlAccountId) throw new Error('Bank GL account not configured');

    const paymentDate = advance.paymentDate;
    let period = await this.prisma.accountingPeriod.findFirst({
      where: {
        fiscalYear: { accountingEntityId: entityId },
        startDate: { lte: paymentDate },
        endDate: { gte: paymentDate },
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
    const amount = Number(advance.amount);

    const journal = await this.prisma.journalEntry.create({
      data: {
        accountingEntity: { connect: { id: entityId } },
        fiscalYear: { connect: { id: period.fiscalYearId } },
        accountingPeriod: { connect: { id: period.id } },
        journalNumber,
        journalType: 'SYSTEM',
        journalDate: advance.paymentDate,
        status: 'DRAFT',
        description: `Vendor Advance ${advance.advanceNumber}`,
        reference: advance.advanceNumber,
        sourceModule: 'AP',
        sourceType: 'VENDOR_ADVANCE',
        sourceId: advance.id,
        postingPurpose: 'vendor_advance.post',
        currency: advance.currency,
        totalDebit: amount,
        totalCredit: amount,
        lines: {
          create: [
            {
              lineNumber: 1,
              accountId: advanceAccount.id,
              description: `Advance to Vendor ${advance.advanceNumber}`,
              debitAmount: amount,
              creditAmount: 0,
              baseAmount: amount,
              partyType: 'VENDOR',
              partyId: advance.vendorId,
            },
            {
              lineNumber: 2,
              accountId: bankGlAccountId,
              description: `Bank disbursement for Advance ${advance.advanceNumber}`,
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

    await this.prisma.vendorAdvance.update({
      where: { id: advance.id },
      data: { postingJournalId: journal.id },
    });

    return journal.id;
  }
}
