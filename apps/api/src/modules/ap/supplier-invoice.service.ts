function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApSequenceService } from './ap-sequence.service.js';
import { DuplicateInvoiceDetectorService } from './duplicate-invoice-detector.service.js';
import { InvoiceMatchingEngine } from './invoice-matching.engine.js';
import { VendorAccountRepository } from './vendor-account.repository.js';
import { VendorSubledgerService } from './vendor-subledger.service.js';
import { ApFinancePostingService } from './ap-finance-posting.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { SupplierInvoice, MatchException } from '@prisma/client';

@Injectable()
export class SupplierInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ApSequenceService,
    private readonly duplicateDetector: DuplicateInvoiceDetectorService,
    private readonly matchingEngine: InvoiceMatchingEngine,
    private readonly vendorAccountRepo: VendorAccountRepository,
    private readonly subledgerService: VendorSubledgerService,
    private readonly financePosting: ApFinancePostingService,
    private readonly eventsService: EventsService,
  ) {}

  async createInvoice(data: any, actor?: any): Promise<SupplierInvoice> {
    // 1. Check duplicate
    const dupCheck = await this.duplicateDetector.checkDuplicate({
      accountingEntityId: data.accountingEntityId,
      vendorId: data.vendorId,
      supplierInvoiceNumber: data.supplierInvoiceNumber,
    });
    if (dupCheck.isDuplicate) {
      throw new ConflictException(
        `Duplicate supplier invoice ${data.supplierInvoiceNumber} already exists for this vendor`,
      );
    }

    // 2. Get or create vendor account
    const vendorAccount = await this.vendorAccountRepo.getOrCreate(
      data.organizationId,
      data.accountingEntityId,
      data.vendorId,
    );

    // 3. Generate internal AP invoice number
    const internalInvoiceNumber = await this.sequenceService.getNextNumber(
      data.organizationId,
      'INVOICE',
    );

    // 4. Calculate line amounts & totals
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let freightTotal = 0;
    let otherCharges = 0;

    const lineItems = (data.lines || []).map((l: any, idx: number) => {
      const qty = Number(l.quantity);
      const price = Number(l.unitPrice);
      const discount = Number(l.discountAmount || 0);
      const tax = Number(l.taxAmount || 0);
      const freight = Number(l.freightAmount || 0);
      const other = Number(l.otherCharges || 0);
      const net = qty * price - discount + tax + freight + other;

      subtotal += qty * price;
      discountTotal += discount;
      taxTotal += tax;
      freightTotal += freight;
      otherCharges += other;

      return {
        lineNumber: l.lineNumber || idx + 1,
        poLineId: l.poLineId || undefined,
        grnLineId: l.grnLineId || undefined,
        serviceReceiptLineId: l.serviceReceiptLineId || undefined,
        inventoryItemId: l.inventoryItemId || undefined,
        description: l.description,
        quantity: qty,
        uom: l.uom || undefined,
        unitPrice: price,
        discountAmount: discount,
        taxAmount: tax,
        freightAmount: freight,
        otherCharges: other,
        netAmount: net,
        expenseAccountMapping: l.expenseAccountMapping || undefined,
        fundId: l.fundId || undefined,
        costCenterId: l.costCenterId || undefined,
        assetId: l.assetId || undefined,
        workOrderId: l.workOrderId || undefined,
      };
    });

    const grandTotal = subtotal - discountTotal + taxTotal + freightTotal + otherCharges;

    // Due date calculation
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(data.invoiceDate);
    if (!data.dueDate) {
      dueDate.setDate(dueDate.getDate() + 30);
    }

    const userId = actor?.userId || actor?.id;

    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        accountingEntity: { connect: { id: data.accountingEntityId } },
        community: data.communityId ? { connect: { id: data.communityId } } : undefined,
        vendor: { connect: { id: data.vendorId } },
        vendorAccount: { connect: { id: vendorAccount.id } },
        purchaseOrder: data.purchaseOrderId ? { connect: { id: data.purchaseOrderId } } : undefined,
        document: data.documentId ? { connect: { id: data.documentId } } : undefined,
        paymentTerms: data.paymentTermsId ? { connect: { id: data.paymentTermsId } } : undefined,
        supplierInvoiceNumber: data.supplierInvoiceNumber,
        internalInvoiceNumber,
        normalizedInvoiceNumber: dupCheck.normalized,
        invoiceDate: new Date(data.invoiceDate),
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
        postingDate: data.postingDate ? new Date(data.postingDate) : new Date(),
        dueDate,
        currency: data.currency || 'INR',
        invoiceType: data.invoiceType || 'PO_GOODS',
        sourceType: data.sourceType || 'PO',
        status: 'DRAFT',
        matchingStatus: 'NOT_STARTED',
        subtotal,
        discountTotal,
        taxTotal,
        freightTotal,
        otherCharges,
        roundingAmount: 0,
        grandTotal,
        paidAmount: 0,
        outstandingAmount: grandTotal,
        createdById: isValidUuid(userId) ? userId : undefined,
        lines: {
          create: lineItems,
        },
      },
      include: { lines: true },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).AP_SUPPLIER_INVOICE_CREATED ?? 'ap.supplier_invoice.created.v1',
        { invoiceId: invoice.id, grandTotal, vendorId: data.vendorId },
        { organizationId: data.organizationId, userId },
      ),
    );

    return invoice;
  }

  async submitAndMatch(invoiceId: string, _actor?: any): Promise<SupplierInvoice> {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true },
    });
    if (!invoice) throw new NotFoundException('Supplier invoice not found');

    const matchResult = await this.matchingEngine.matchInvoice(invoiceId);

    // Save match snapshot
    await this.prisma.matchSnapshot.create({
      data: {
        supplierInvoice: { connect: { id: invoiceId } },
        snapshotVersion: 1,
        matchType: matchResult.summary.matchType,
        overallStatus: matchResult.matchingStatus,
        summaryData: matchResult.summary as any,
        tolerancesApplied: {} as any,
      },
    });

    // Save match exceptions
    if (matchResult.exceptions.length > 0) {
      for (const exc of matchResult.exceptions) {
        await this.prisma.matchException.create({
          data: {
            supplierInvoice: { connect: { id: invoiceId } },
            invoiceLine: exc.lineId ? { connect: { id: exc.lineId } } : undefined,
            exceptionType: exc.exceptionType,
            expectedValue: exc.expectedValue,
            actualValue: exc.actualValue,
            varianceValue: exc.varianceValue,
            toleranceAllowed: exc.toleranceAllowed,
            severity: exc.severity,
            status: 'OPEN',
            resolutionReason: exc.reason,
          },
        });
      }
    }

    const newStatus =
      matchResult.matchingStatus === 'MATCHED' || matchResult.matchingStatus === 'NOT_REQUIRED'
        ? 'APPROVED'
        : 'EXCEPTION';

    const updated = await this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        matchingStatus: matchResult.matchingStatus,
      },
      include: { lines: true, matchExceptions: true },
    });

    return updated;
  }

  async resolveException(exceptionId: string, data: any, actor?: any): Promise<MatchException> {
    const exc = await this.prisma.matchException.findUnique({
      where: { id: exceptionId },
      include: { supplierInvoice: true },
    });
    if (!exc) throw new NotFoundException('Match exception not found');

    const userId = actor?.userId || actor?.id;

    const resolved = await this.prisma.matchException.update({
      where: { id: exceptionId },
      data: {
        status: 'RESOLVED',
        resolutionType: data.resolutionType,
        resolutionReason: data.resolutionReason,
        resolvedById: isValidUuid(userId) ? userId : undefined,
        resolvedAt: new Date(),
      },
    });

    // Check if all exceptions for invoice are resolved
    const remainingOpen = await this.prisma.matchException.count({
      where: {
        supplierInvoiceId: exc.supplierInvoiceId,
        status: 'OPEN',
      },
    });

    if (remainingOpen === 0) {
      await this.prisma.supplierInvoice.update({
        where: { id: exc.supplierInvoiceId },
        data: {
          status: 'APPROVED',
          matchingStatus: 'OVERRIDDEN',
        },
      });
    }

    return resolved;
  }

  async setPaymentHold(
    invoiceId: string,
    hold: boolean,
    reason?: any,
    notes?: string,
    actor?: any,
  ): Promise<SupplierInvoice> {
    const invoice = await this.prisma.supplierInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Supplier invoice not found');

    const userId = actor?.userId || actor?.id;

    return this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        isOnHold: hold,
        holdReason: hold ? reason : null,
        holdNotes: hold ? notes : null,
        holdAt: hold ? new Date() : null,
        holdById: hold && isValidUuid(userId) ? userId : null,
      },
    });
  }

  async postToGeneralLedger(invoiceId: string, actor: any): Promise<SupplierInvoice> {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: { vendorAccount: true },
    });
    if (!invoice) throw new NotFoundException('Supplier invoice not found');
    if (invoice.status === 'POSTED') return invoice;

    // 1. Post to GL
    const journalId = await this.financePosting.postSupplierInvoice(invoiceId, actor);

    // 2. Post to Vendor Subledger (Credit AP liability)
    await this.subledgerService.postEntry({
      vendorAccountId: invoice.vendorAccountId,
      entryDate: invoice.invoiceDate,
      entryType: 'SUPPLIER_INVOICE',
      referenceType: 'SUPPLIER_INVOICE',
      referenceId: invoice.internalInvoiceNumber,
      debit: 0,
      credit: Number(invoice.grandTotal),
      description: `Supplier Invoice ${invoice.supplierInvoiceNumber} posted`,
      postingJournalId: journalId,
    });

    const updated = await this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'POSTED',
        postingJournalId: journalId,
      },
      include: { lines: true },
    });

    return updated;
  }

  async findById(id: string): Promise<any> {
    return this.prisma.supplierInvoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        vendorAccount: true,
        purchaseOrder: true,
        lines: true,
        matchExceptions: true,
        matchSnapshots: true,
        creditNoteAllocations: true,
        paymentAllocations: true,
        advanceAllocations: true,
      },
    });
  }

  async list(filters: any): Promise<SupplierInvoice[]> {
    return this.prisma.supplierInvoice.findMany({
      where: {
        organizationId: filters.organizationId,
        accountingEntityId: filters.accountingEntityId,
        vendorId: filters.vendorId,
        status: filters.status,
        matchingStatus: filters.matchingStatus,
        isOnHold:
          filters.isOnHold !== undefined
            ? filters.isOnHold === 'true' || filters.isOnHold === true
            : undefined,
      },
      include: { vendor: true, lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
