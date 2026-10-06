import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class JournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.JournalEntryCreateInput) {
    return this.prisma.journalEntry.create({
      data,
      include: {
        lines: {
          include: {
            account: true,
            costCenter: true,
            fund: true,
          },
        },
        fiscalYear: true,
        accountingPeriod: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
          include: {
            account: true,
            costCenter: true,
            fund: true,
          },
        },
        fiscalYear: true,
        accountingPeriod: true,
        postedByUser: true,
        createdByUser: true,
        reversalJournal: true,
        originalJournal: true,
      },
    });
  }

  async findBySource(
    sourceModule: string,
    sourceType: string,
    sourceId: string,
    postingPurpose?: string,
  ) {
    return this.prisma.journalEntry.findFirst({
      where: {
        sourceModule,
        sourceType,
        sourceId,
        ...(postingPurpose ? { postingPurpose } : {}),
      },
      include: {
        lines: {
          include: {
            account: true,
            costCenter: true,
            fund: true,
          },
        },
      },
    });
  }

  async findMany(params: {
    accountingEntityId: string;
    status?: any;
    journalType?: any;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.JournalEntryWhereInput = {
      accountingEntityId: params.accountingEntityId,
    };
    if (params.status) where.status = params.status;
    if (params.journalType) where.journalType = params.journalType;
    if (params.startDate || params.endDate) {
      where.journalDate = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { journalDate: 'desc' },
        include: {
          lines: {
            include: {
              account: true,
              costCenter: true,
              fund: true,
            },
          },
          fiscalYear: true,
          accountingPeriod: true,
        },
      }),
    ]);

    return { total, items };
  }

  async update(id: string, data: Prisma.JournalEntryUpdateInput) {
    return this.prisma.journalEntry.update({
      where: { id },
      data,
      include: {
        lines: {
          include: {
            account: true,
            costCenter: true,
            fund: true,
          },
        },
      },
    });
  }
}
