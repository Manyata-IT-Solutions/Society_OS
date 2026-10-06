import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BankAccount } from '@prisma/client';

@Injectable()
export class BankAccountService {
  constructor(private readonly prisma: PrismaService) {}

  maskAccountNumber(accNo: string): string {
    if (!accNo || accNo.length <= 4) return accNo;
    const last4 = accNo.slice(-4);
    return 'X'.repeat(Math.max(0, accNo.length - 4)) + last4;
  }

  async create(data: any): Promise<BankAccount> {
    const masked = this.maskAccountNumber(data.accountNumber);

    const existing = await this.prisma.bankAccount.findFirst({
      where: {
        accountingEntityId: data.accountingEntityId,
        maskedAccountNumber: masked,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Bank account with this number already exists for this accounting entity',
      );
    }

    return this.prisma.bankAccount.create({
      data: {
        accountingEntity: { connect: { id: data.accountingEntityId } },
        glAccount: { connect: { id: data.glAccountId } },
        name: data.name,
        bankName: data.bankName,
        accountType: data.accountType || 'CURRENT',
        currency: data.currency || 'INR',
        maskedAccountNumber: masked,
        routingCode: data.routingCode || undefined,
        status: 'ACTIVE',
        isDefault: data.isDefault || false,
      },
    });
  }

  async list(accountingEntityId: string): Promise<BankAccount[]> {
    return this.prisma.bankAccount.findMany({
      where: { accountingEntityId },
      include: { glAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<BankAccount | null> {
    return this.prisma.bankAccount.findUnique({
      where: { id },
      include: { glAccount: true },
    });
  }
}
