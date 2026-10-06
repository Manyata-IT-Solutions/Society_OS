import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetTemplate } from '@prisma/client';

@Injectable()
export class BudgetTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async createTemplate(data: any): Promise<BudgetTemplate> {
    return this.prisma.budgetTemplate.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        name: data.name,
        code: data.code,
        description: data.description,
        budgetType: data.budgetType || 'OPERATING',
        lines: {
          create: (data.lines || []).map((l: any, idx: number) => ({
            lineNumber: idx + 1,
            account: { connect: { id: l.accountId } },
            fund: l.fundId ? { connect: { id: l.fundId } } : undefined,
            costCenter: l.costCenterId ? { connect: { id: l.costCenterId } } : undefined,
            lineType: l.lineType || 'OPEX',
            allocationMethod: l.allocationMethod || 'EQUAL',
            weightPercent: l.weightPercent,
            description: l.description,
          })),
        },
      },
      include: { lines: { include: { account: true, fund: true, costCenter: true } } },
    });
  }

  async listTemplates(organizationId: string): Promise<BudgetTemplate[]> {
    return this.prisma.budgetTemplate.findMany({
      where: { organizationId },
      include: { lines: { include: { account: true, fund: true, costCenter: true } } },
    });
  }
}
