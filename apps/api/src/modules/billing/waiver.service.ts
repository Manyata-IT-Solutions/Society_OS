function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BillingSequenceService } from './billing-sequence.service.js';
import { ResidentLedgerService } from './resident-ledger.service.js';
import { EventsService } from '../events/events.service.js';
import { createEvent, DOMAIN_EVENTS } from '@community-os/events';
import { WaiverRequest } from '@prisma/client';

@Injectable()
export class WaiverService {
  private readonly logger = new Logger(WaiverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: BillingSequenceService,
    private readonly ledgerService: ResidentLedgerService,
    private readonly events: EventsService,
  ) {}

  async createWaiverRequest(
    data: {
      communityId: string;
      invoiceId: string;
      amount: number;
      reason: string;
    },
    actor?: any,
  ): Promise<WaiverRequest> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const waiverNumber = await this.sequenceService.getNextNumber(data.communityId, 'WAIVER');
    const amount = Number(data.amount);
    const userId = actor?.userId || actor?.id;

    if (amount > Number(invoice.outstandingAmount)) {
      throw new BadRequestException('Waiver amount exceeds invoice outstanding dues');
    }

    let userUuid = isValidUuid(userId) ? userId : undefined;
    if (!userUuid) {
      const firstUser = await this.prisma.user.findFirst();
      userUuid = firstUser?.id;
    }

    const waiver = await this.prisma.waiverRequest.create({
      data: {
        community: { connect: { id: data.communityId } },
        invoice: { connect: { id: data.invoiceId } },
        billableAccountId: invoice.billableAccountId,
        waiverNumber,
        amount,
        reason: data.reason,
        status: 'PENDING_APPROVAL',
        requestedBy: { connect: { id: userUuid } },
      },
    });

    return waiver;
  }

  async approveWaiver(
    waiverId: string,
    approved: boolean,
    rejectionReason?: string,
    actor?: any,
  ): Promise<WaiverRequest> {
    const waiver = await this.prisma.waiverRequest.findUnique({
      where: { id: waiverId },
      include: { invoice: true },
    });

    if (!waiver) throw new NotFoundException('Waiver request not found');
    if (waiver.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Waiver is not in pending approval state');
    }

    const userId = actor?.userId || actor?.id;

    if (!approved) {
      return this.prisma.waiverRequest.update({
        where: { id: waiverId },
        data: {
          status: 'REJECTED',
          rejectionReason,
          approvedBy: isValidUuid(userId) ? { connect: { id: userId } } : undefined,
          approvedAt: new Date(),
        },
      });
    }

    // Approve waiver: adjust invoice outstanding and post subledger credit
    const invoice = waiver.invoice;
    const newOutstanding = Math.max(0, Number(invoice.outstandingAmount) - Number(waiver.amount));

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        outstandingAmount: newOutstanding,
        waiverTotal: Number(invoice.waiverTotal) + Number(waiver.amount),
        status: newOutstanding <= 0.001 ? 'PAID' : invoice.status,
      },
    });

    await this.ledgerService.postEntry({
      billableAccountId: waiver.billableAccountId,
      entryDate: new Date(),
      entryType: 'WAIVER',
      referenceType: 'WAIVER',
      referenceId: waiver.waiverNumber,
      debit: 0,
      credit: Number(waiver.amount),
      description: `Fee Waiver Approved: ${waiver.reason}`,
    });

    const updated = await this.prisma.waiverRequest.update({
      where: { id: waiverId },
      data: {
        status: 'APPROVED',
        approvedBy: isValidUuid(userId) ? { connect: { id: userId } } : undefined,
        approvedAt: new Date(),
      },
    });

    this.events.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BILLING_WAIVER_APPROVED ?? 'billing.waiver.approved.v1',
        { waiverId: updated.id, invoiceId: updated.invoiceId, amount: Number(updated.amount) },
        { organizationId: waiver.communityId, userId },
      ),
    );

    return updated;
  }

  async createCreditNote(
    data: {
      communityId: string;
      invoiceId: string;
      amount: number;
      reason: string;
    },
    actor?: any,
  ): Promise<any> {
    try {
      const invoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');

      const creditNoteNumber = await this.sequenceService.getNextNumber(
        data.communityId,
        'CREDIT_NOTE',
      );
      const amount = Number(data.amount);
      const userId = actor?.userId || actor?.id;

      const cn = await this.prisma.creditNote.create({
        data: {
          community: { connect: { id: data.communityId } },
          invoice: { connect: { id: data.invoiceId } },
          billableAccountId: invoice.billableAccountId,
          creditNoteNumber,
          amount,
          reason: data.reason,
          status: 'APPROVED',
          approvedBy: isValidUuid(userId) ? { connect: { id: userId } } : undefined,
        },
      });

      const newOutstanding = Math.max(0, Number(invoice.outstandingAmount) - amount);
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          outstandingAmount: newOutstanding,
          discountTotal: Number(invoice.discountTotal) + amount,
          status: newOutstanding <= 0.001 ? 'PAID' : invoice.status,
        },
      });

      await this.ledgerService.postEntry({
        billableAccountId: invoice.billableAccountId,
        entryDate: new Date(),
        entryType: 'CREDIT_NOTE',
        referenceType: 'CREDIT_NOTE',
        referenceId: creditNoteNumber,
        debit: 0,
        credit: amount,
        description: `Credit Note: ${data.reason}`,
      });

      return {
        id: cn.id,
        communityId: cn.communityId,
        creditNoteNumber: cn.creditNoteNumber,
        invoiceId: cn.invoiceId,
        billableAccountId: cn.billableAccountId,
        amount: Number(cn.amount),
        reason: cn.reason,
        status: cn.status,
      };
    } catch (err: any) {
      console.error('Error in createCreditNote:', err);
      throw err;
    }
  }
}
