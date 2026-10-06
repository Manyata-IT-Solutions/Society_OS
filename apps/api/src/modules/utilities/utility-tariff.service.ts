import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateUtilityTariffPlanDto } from '@community-os/contracts';

@Injectable()
export class UtilityTariffService {
  constructor(private readonly prisma: PrismaService) {}

  async createTariffPlan(dto: CreateUtilityTariffPlanDto) {
    const plan = await this.prisma.utilityTariffPlan.create({
      data: {
        utilityServiceId: dto.utilityServiceId,
        name: dto.name,
        code: dto.code,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
        currency: dto.currency || 'INR',
        billingUom: dto.billingUom,
        status: 'ACTIVE',
        components: {
          create: dto.components.map((c, idx) => ({
            componentType: c.componentType as any,
            name: c.name,
            fixedAmount: c.fixedAmount,
            ratePerUnit: c.ratePerUnit,
            minimumAmount: c.minimumAmount,
            slabsPayload: c.slabs as any,
            displayOrder: idx + 1,
          })),
        },
      },
      include: { components: true },
    });

    return plan;
  }

  async getEffectiveTariff(serviceId: string, asOfDate: Date = new Date()) {
    const plan = await this.prisma.utilityTariffPlan.findFirst({
      where: {
        utilityServiceId: serviceId,
        status: 'ACTIVE',
        effectiveFrom: { lte: asOfDate },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: asOfDate } }],
      },
      include: { components: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    return plan;
  }

  calculateTariffCharges(components: any[], units: number) {
    let fixedCharge = 0;
    let energyCharge = 0;
    const slabBreakdown: any[] = [];

    for (const comp of components) {
      if (comp.componentType === 'FIXED' && comp.fixedAmount) {
        fixedCharge += Number(comp.fixedAmount);
      } else if (comp.componentType === 'PER_UNIT' && comp.ratePerUnit) {
        energyCharge += units * Number(comp.ratePerUnit);
      } else if (comp.componentType === 'SLAB' && comp.slabsPayload) {
        const slabs = comp.slabsPayload as any[];
        for (const slab of slabs) {
          const from = Number(slab.fromUnit);
          const to = slab.toUnit ? Number(slab.toUnit) : Infinity;
          const rate = Number(slab.ratePerUnit);

          if (units > from) {
            const applicableUnits = Math.min(units, to) - from;
            const amount = applicableUnits * rate;
            energyCharge += amount;
            slabBreakdown.push({ from, to, rate, applicableUnits, amount });
          }
        }
      }
    }

    const netTotal = fixedCharge + energyCharge;
    return {
      fixedCharge,
      energyCharge,
      slabBreakdown,
      netTotal,
    };
  }
}
