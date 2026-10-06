import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class FiscalCalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCalendar(data: Prisma.FiscalCalendarCreateInput) {
    return this.prisma.fiscalCalendar.create({ data });
  }

  async findDefaultCalendar(accountingEntityId: string) {
    return this.prisma.fiscalCalendar.findFirst({
      where: { accountingEntityId, isDefault: true },
    });
  }

  async createFiscalYear(data: Prisma.FiscalYearCreateInput) {
    return this.prisma.fiscalYear.create({
      data,
      include: { periods: true },
    });
  }

  async findFiscalYearById(id: string) {
    return this.prisma.fiscalYear.findUnique({
      where: { id },
      include: { periods: { orderBy: { periodNumber: 'asc' } } },
    });
  }

  async findFiscalYears(accountingEntityId: string) {
    return this.prisma.fiscalYear.findMany({
      where: { accountingEntityId },
      include: { periods: { orderBy: { periodNumber: 'asc' } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async findPeriodByDate(accountingEntityId: string, date: Date) {
    return this.prisma.accountingPeriod.findFirst({
      where: {
        fiscalYear: { accountingEntityId },
        startDate: { lte: date },
        endDate: { gte: date },
      },
      include: { fiscalYear: true },
    });
  }

  async findPeriodById(id: string) {
    return this.prisma.accountingPeriod.findUnique({
      where: { id },
      include: { fiscalYear: true },
    });
  }

  async updatePeriod(id: string, data: Prisma.AccountingPeriodUpdateInput) {
    return this.prisma.accountingPeriod.update({
      where: { id },
      data,
      include: { fiscalYear: true },
    });
  }

  async updateFiscalYear(id: string, data: Prisma.FiscalYearUpdateInput) {
    return this.prisma.fiscalYear.update({
      where: { id },
      data,
      include: { periods: true },
    });
  }
}
