import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { InvoiceRepository } from './invoice.repository.js';
import { BillingSequenceService } from './billing-sequence.service.js';
import { ResidentLedgerService } from './resident-ledger.service.js';
import { BillingFinancePostingService } from './billing-finance-posting.service.js';
import { InvoiceDocumentService } from './invoice-document.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { Invoice } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceRepo: InvoiceRepository,
    private readonly sequenceService: BillingSequenceService,
    private readonly ledgerService: ResidentLedgerService,
    private readonly financePosting: BillingFinancePostingService,
    private readonly documentService: InvoiceDocumentService,
    private readonly eventsService: EventsService,
  ) {}

  async getInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async listInvoices(params: {
    communityId: string;
    billableAccountId?: string;
    billingPeriodId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<[Invoice[], number]> {
    return this.invoiceRepo.list(params);
  }

  async issueInvoice(id: string, actor?: any): Promise<Invoice> {
    const invoice = await this.getInvoice(id);
    if (invoice.status === 'ISSUED' || invoice.status === 'PAID') {
      return invoice;
    }

    const updated = await this.invoiceRepo.update(id, {
      status: 'ISSUED',
      issuedAt: new Date(),
    });

    await this.ledgerService.postEntry({
      billableAccountId: invoice.billableAccountId,
      entryDate: invoice.invoiceDate,
      entryType: 'INVOICE',
      referenceType: 'INVOICE',
      referenceId: invoice.invoiceNumber,
      debit: Number(invoice.grandTotal),
      credit: 0,
      description: `Maintenance Invoice ${invoice.invoiceNumber}`,
    });

    await this.documentService.generateInvoicePdf(invoice.id);
    await this.financePosting.postInvoiceIssue(invoice.id, actor);

    const userId = actor?.userId || actor?.id;
    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BILLING_INVOICE_ISSUED ?? 'billing.invoice.issued.v1',
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: Number(invoice.grandTotal),
          communityId: invoice.communityId,
        },
        { organizationId: invoice.organizationId, userId },
      ),
    );

    return updated;
  }

  async cancelInvoice(id: string, reason: string, _actor?: any): Promise<Invoice> {
    const invoice = await this.getInvoice(id);
    if (invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID') {
      throw new BadRequestException(
        'Cannot cancel paid or partially paid invoice. Use Credit Note instead.',
      );
    }

    const updated = await this.invoiceRepo.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });

    if (invoice.status === 'ISSUED') {
      await this.ledgerService.postEntry({
        billableAccountId: invoice.billableAccountId,
        entryDate: new Date(),
        entryType: 'ADJUSTMENT',
        referenceType: 'INVOICE_CANCEL',
        referenceId: invoice.invoiceNumber,
        debit: 0,
        credit: Number(invoice.grandTotal),
        description: `Invoice Cancelled: ${reason}`,
      });
    }

    return updated;
  }
}
