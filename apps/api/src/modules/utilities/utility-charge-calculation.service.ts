import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UtilityTariffService } from './utility-tariff.service.js';
import { CalculateUtilityChargeDto } from '@community-os/contracts';

@Injectable()
export class UtilityChargeCalculationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tariffService: UtilityTariffService,
  ) {}

  async calculateCharge(dto: CalculateUtilityChargeDto) {
    const pStart = new Date(dto.periodStart);
    const pEnd = new Date(dto.periodEnd);

    const consumption = await this.prisma.utilityConsumptionRecord.findFirst({
      where: { meterId: dto.meterId, periodStart: { lte: pStart }, periodEnd: { gte: pEnd } },
    });
    if (!consumption) {
      throw new NotFoundException('No valid consumption record found for meter in period');
    }

    const tariff = await this.prisma.utilityTariffPlan.findUnique({
      where: { id: dto.tariffPlanId },
      include: { components: true },
    });
    if (!tariff) throw new NotFoundException('Tariff plan not found');

    const breakdown = this.tariffService.calculateTariffCharges(
      tariff.components,
      Number(consumption.consumption),
    );

    const charge = await this.prisma.utilityChargeCalculation.create({
      data: {
        meterId: dto.meterId,
        consumptionRecordId: consumption.id,
        tariffPlanId: tariff.id,
        periodStart: pStart,
        periodEnd: pEnd,
        grossAmount: breakdown.netTotal,
        adjustmentsAmount: 0.0,
        netAmount: breakdown.netTotal,
        currency: tariff.currency,
        status: 'VALIDATED',
        breakdownSnapshot: breakdown as any,
      },
    });

    return charge;
  }
}
