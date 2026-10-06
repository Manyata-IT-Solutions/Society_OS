import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { DocumentService } from '../document/document.service.js';

@Injectable()
export class RemittanceAdviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService,
  ) {}

  async generateRemittanceAdvice(paymentId: string, _actor?: any): Promise<string> {
    const payment = await this.prisma.vendorPayment.findUnique({
      where: { id: paymentId },
      include: {
        vendorAccount: { include: { vendor: true } },
        allocations: { include: { supplierInvoice: true } },
      },
    });

    if (!payment) throw new Error('Vendor payment not found');
    if (payment.remittanceDocId) return payment.remittanceDocId;

    const doc = await this.prisma.document.create({
      data: {
        organization: { connect: { id: payment.organizationId } },
        community: payment.communityId ? { connect: { id: payment.communityId } } : undefined,
        title: `Remittance Advice ${payment.paymentNumber}.pdf`,
        category: 'FINANCIAL',
        classification: 'INTERNAL',
        status: 'ACTIVE',
        versions: {
          create: {
            versionNumber: 1,
            fileName: `${payment.paymentNumber}-remittance.pdf`,
            originalFileName: `${payment.paymentNumber}-remittance.pdf`,
            storageKey: `documents/remittance/${payment.paymentNumber}.pdf`,
            mimeType: 'application/pdf',
            sizeBytes: BigInt(28000),
            checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        },
      },
    });

    await this.prisma.vendorPayment.update({
      where: { id: payment.id },
      data: { remittanceDocId: doc.id },
    });

    return doc.id;
  }
}
