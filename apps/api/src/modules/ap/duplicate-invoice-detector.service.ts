import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class DuplicateInvoiceDetectorService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeInvoiceNumber(invoiceNumber: string): string {
    if (!invoiceNumber) return '';
    return invoiceNumber
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  async checkDuplicate(params: {
    accountingEntityId: string;
    vendorId: string;
    supplierInvoiceNumber: string;
    excludeInvoiceId?: string;
  }): Promise<{ isDuplicate: boolean; duplicateInvoiceId?: string; normalized: string }> {
    const normalized = this.normalizeInvoiceNumber(params.supplierInvoiceNumber);

    const existing = await this.prisma.supplierInvoice.findFirst({
      where: {
        accountingEntityId: params.accountingEntityId,
        vendorId: params.vendorId,
        normalizedInvoiceNumber: normalized,
        id: params.excludeInvoiceId ? { not: params.excludeInvoiceId } : undefined,
        status: { notIn: ['CANCELLED', 'REVERSED'] },
      },
      select: { id: true },
    });

    if (existing) {
      return {
        isDuplicate: true,
        duplicateInvoiceId: existing.id,
        normalized,
      };
    }

    return {
      isDuplicate: false,
      normalized,
    };
  }
}
