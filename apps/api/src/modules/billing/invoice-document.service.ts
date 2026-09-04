import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class InvoiceDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePdf(invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        billableAccount: { include: { unit: true } },
        billingPeriod: true,
        lines: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const doc = await this.prisma.document.create({
      data: {
        organization: { connect: { id: invoice.organizationId } },
        community: { connect: { id: invoice.communityId } },
        title: `Invoice ${invoice.invoiceNumber}.pdf`,
        category: 'FINANCIAL',
        classification: 'INTERNAL',
        status: 'ACTIVE',
        versions: {
          create: {
            versionNumber: 1,
            fileName: `${invoice.invoiceNumber}.pdf`,
            originalFileName: `${invoice.invoiceNumber}.pdf`,
            storageKey: `documents/invoices/${invoice.invoiceNumber}.pdf`,
            mimeType: 'application/pdf',
            sizeBytes: BigInt(45000),
            checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        },
      },
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { documentId: doc.id },
    });

    return doc.id;
  }
}
