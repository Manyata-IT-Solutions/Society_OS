import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ExecuteAnalyticsQueryDto } from '@community-os/contracts';

@Injectable()
export class AnalyticsQueryEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async executeQuery(dto: ExecuteAnalyticsQueryDto) {
    if (!dto.metrics || dto.metrics.length === 0) {
      throw new BadRequestException('At least one metric must be requested');
    }

    const metricDefs = await this.prisma.metricDefinition.findMany({
      where: { metricKey: { in: dto.metrics } },
    });

    if (metricDefs.length === 0) {
      throw new BadRequestException('No valid metrics found for query');
    }

    const results: Record<string, any> = {};

    for (const m of metricDefs) {
      if (m.metricKey === 'finance.collection_efficiency') {
        const invoices = await this.prisma.invoice.findMany({
          where: dto.communityId ? { communityId: dto.communityId } : {},
        });
        const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.grandTotal), 0);
        const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.allocatedAmount), 0);
        const eff = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 100;
        results[m.metricKey] = Number(eff.toFixed(2));
      } else if (m.metricKey === 'finance.total_billed') {
        const invoices = await this.prisma.invoice.findMany({
          where: dto.communityId ? { communityId: dto.communityId } : {},
        });
        results[m.metricKey] = invoices.reduce((acc, inv) => acc + Number(inv.grandTotal), 0);
      } else if (m.metricKey === 'finance.total_collected') {
        const invoices = await this.prisma.invoice.findMany({
          where: dto.communityId ? { communityId: dto.communityId } : {},
        });
        results[m.metricKey] = invoices.reduce((acc, inv) => acc + Number(inv.allocatedAmount), 0);
      } else if (m.metricKey === 'finance.outstanding_ar') {
        const invoices = await this.prisma.invoice.findMany({
          where: {
            status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
            ...(dto.communityId ? { communityId: dto.communityId } : {}),
          },
        });
        results[m.metricKey] = invoices.reduce(
          (acc, inv) => acc + Number(inv.outstandingAmount || 0),
          0,
        );
      } else if (m.metricKey === 'helpdesk.sla_compliance') {
        const total = await this.prisma.ticket.count({
          where: dto.communityId ? { communityId: dto.communityId } : {},
        });
        const breached = await this.prisma.ticket.count({
          where: {
            slaStatus: 'BREACHED',
            ...(dto.communityId ? { communityId: dto.communityId } : {}),
          },
        });
        const compliance = total > 0 ? ((total - breached) / total) * 100 : 100;
        results[m.metricKey] = Number(compliance.toFixed(2));
      } else if (m.metricKey === 'assets.critical_down') {
        results[m.metricKey] = await this.prisma.asset.count({
          where: {
            operationalStatus: { in: ['OUT_OF_SERVICE', 'UNDER_MAINTENANCE'] },
            criticality: 'CRITICAL',
            ...(dto.communityId ? { communityId: dto.communityId } : {}),
          },
        });
      } else {
        results[m.metricKey] = 0;
      }
    }

    return {
      results: [results],
      meta: {
        metrics: dto.metrics,
        dimensions: dto.dimensions || [],
        freshness: new Date().toISOString(),
        currency: 'INR',
      },
    };
  }
}
