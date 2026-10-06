import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateMetricDefinitionDto, CreateMetricTargetDto } from '@community-os/contracts';

@Injectable()
export class MetricRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async registerMetric(dto: CreateMetricDefinitionDto) {
    const existing = await this.prisma.metricDefinition.findUnique({
      where: { metricKey: dto.metricKey },
    });
    if (existing) throw new BadRequestException(`Metric with key ${dto.metricKey} already exists`);

    return this.prisma.metricDefinition.create({
      data: {
        metricKey: dto.metricKey,
        name: dto.name,
        description: dto.description,
        domain: dto.domain,
        category: dto.category,
        valueType: dto.valueType,
        aggregationType: dto.aggregationType,
        unit: dto.unit,
        currencyBehavior: dto.currencyBehavior,
        grain: dto.grain,
        sourceDataset: dto.sourceDataset,
        formula: dto.formula,
        dimensions: dto.dimensions,
        status: dto.status || 'ACTIVE',
        version: 1,
      },
    });
  }

  async getMetric(metricKey: string) {
    const metric = await this.prisma.metricDefinition.findUnique({
      where: { metricKey },
      include: { targets: true },
    });
    if (!metric) throw new NotFoundException(`Metric ${metricKey} not found`);
    return metric;
  }

  async listMetrics(domain?: string) {
    const where: any = { status: 'ACTIVE' };
    if (domain) where.domain = domain;
    return this.prisma.metricDefinition.findMany({
      where,
      include: { targets: true },
      orderBy: { metricKey: 'asc' },
    });
  }

  async setTarget(dto: CreateMetricTargetDto) {
    await this.getMetric(dto.metricKey);

    return this.prisma.metricTarget.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        metricKey: dto.metricKey,
        period: dto.period,
        targetValue: dto.targetValue,
        comparisonOperator: dto.comparisonOperator,
      },
    });
  }
}
