import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { VendorAccount } from '@prisma/client';

@Injectable()
export class VendorAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<VendorAccount | null> {
    return this.prisma.vendorAccount.findUnique({
      where: { id },
      include: { vendor: true, accountingEntity: true },
    });
  }

  async findByVendorAndEntity(
    accountingEntityId: string,
    vendorId: string,
  ): Promise<VendorAccount | null> {
    return this.prisma.vendorAccount.findUnique({
      where: { accountingEntityId_vendorId: { accountingEntityId, vendorId } },
      include: { vendor: true, accountingEntity: true },
    });
  }

  async getOrCreate(
    organizationId: string,
    accountingEntityId: string,
    vendorId: string,
  ): Promise<VendorAccount> {
    let account = await this.findByVendorAndEntity(accountingEntityId, vendorId);
    if (!account) {
      const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
      const accountNumber = `VACC-${vendor?.vendorCode || vendorId.slice(0, 8)}`;
      account = await this.prisma.vendorAccount.create({
        data: {
          organization: { connect: { id: organizationId } },
          accountingEntity: { connect: { id: accountingEntityId } },
          vendor: { connect: { id: vendorId } },
          accountNumber,
          currency: 'INR',
          status: 'ACTIVE',
        },
        include: { vendor: true, accountingEntity: true },
      });
    }
    return account;
  }

  async updateBalances(
    id: string,
    data: { currentPayable?: any; advanceBalance?: any; creditBalance?: any },
  ): Promise<VendorAccount> {
    return this.prisma.vendorAccount.update({
      where: { id },
      data,
    });
  }
}
