import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChartOfAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(data: Prisma.LedgerAccountCreateInput) {
    return this.prisma.ledgerAccount.create({ data });
  }

  async findAccountById(id: string) {
    return this.prisma.ledgerAccount.findUnique({
      where: { id },
      include: {
        parentAccount: true,
        childAccounts: true,
        mappings: true,
      },
    });
  }

  async findAccountByCode(accountingEntityId: string, accountCode: string) {
    return this.prisma.ledgerAccount.findUnique({
      where: {
        accountingEntityId_accountCode: {
          accountingEntityId,
          accountCode,
        },
      },
    });
  }

  async findAccounts(accountingEntityId: string, filter?: { accountType?: any; status?: any }) {
    const where: Prisma.LedgerAccountWhereInput = { accountingEntityId };
    if (filter?.accountType) where.accountType = filter.accountType;
    if (filter?.status) where.status = filter.status;

    return this.prisma.ledgerAccount.findMany({
      where,
      orderBy: { accountCode: 'asc' },
      include: {
        parentAccount: true,
      },
    });
  }

  async updateAccount(id: string, data: Prisma.LedgerAccountUpdateInput) {
    return this.prisma.ledgerAccount.update({
      where: { id },
      data,
    });
  }

  async createMapping(data: Prisma.AccountMappingCreateInput) {
    return this.prisma.accountMapping.upsert({
      where: {
        accountingEntityId_mappingKey: {
          accountingEntityId: data.accountingEntity.connect?.id || '',
          mappingKey: data.mappingKey,
        },
      },
      update: {
        account: data.account,
        description: data.description,
      },
      create: data,
    });
  }

  async findMapping(accountingEntityId: string, mappingKey: string) {
    return this.prisma.accountMapping.findUnique({
      where: {
        accountingEntityId_mappingKey: {
          accountingEntityId,
          mappingKey,
        },
      },
      include: { account: true },
    });
  }

  async findMappings(accountingEntityId: string) {
    return this.prisma.accountMapping.findMany({
      where: { accountingEntityId },
      include: { account: true },
    });
  }
}
