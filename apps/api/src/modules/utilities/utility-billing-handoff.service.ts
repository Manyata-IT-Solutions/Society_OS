import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { HandoffUtilityChargeDto } from '@community-os/contracts';

@Injectable()
export class UtilityBillingHandoffService {
  constructor(private readonly prisma: PrismaService) {}

  async handoffToBilling(dto: HandoffUtilityChargeDto) {
    const charge = await this.prisma.utilityChargeCalculation.findUnique({
      where: { id: dto.chargeCalculationId },
    });
    if (!charge) throw new NotFoundException('Charge calculation not found');

    if (charge.status === 'HANDED_OFF') {
      // Idempotent return
      return { success: true, message: 'Charge was already handed off (Idempotent)', charge };
    }

    const updated = await this.prisma.utilityChargeCalculation.update({
      where: { id: dto.chargeCalculationId },
      data: {
        status: 'HANDED_OFF',
        handedOffAt: new Date(),
        billableAccountId: dto.billableAccountId,
      },
    });

    return {
      success: true,
      message: 'Successfully handed off to Phase 14 billing engine',
      charge: updated,
    };
  }
}
