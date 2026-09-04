import { Injectable } from '@nestjs/common';
import { Unit } from '@prisma/client';

export interface CalculatedLine {
  chargeDefinitionId: string;
  descriptionSnapshot: string;
  quantity: number;
  rate: number;
  amount: number;
  discountAmount: number;
  waiverAmount: number;
  netAmount: number;
  fundId?: string | null;
  costCenterId?: string | null;
  accountingMappingKey: string;
}

@Injectable()
export class ChargeCalculatorService {
  calculateRule(rule: any, unit?: Unit | null): CalculatedLine {
    let quantity = 1;
    let rate = Number(rule.rate || 0);
    let amount = 0;
    const u = unit as any;
    const unitArea = Number(u?.superBuiltUpArea || u?.builtUpArea || u?.carpetArea || 1200);

    switch (rule.calculationMethod) {
      case 'PER_SQFT':
      case 'PER_SQM':
        quantity = unitArea;
        rate = Number(rule.rate);
        amount = quantity * rate;
        break;
      case 'PER_UNIT':
      case 'FIXED_AMOUNT':
        quantity = 1;
        rate = Number(rule.amount || rule.rate || 0);
        amount = rate;
        break;
      case 'PER_PARKING':
        quantity = u?.parkingSlots || 1;
        rate = Number(rule.amount || rule.rate || 0);
        amount = quantity * rate;
        break;
      default:
        quantity = 1;
        rate = Number(rule.amount || rule.rate || 0);
        amount = rate;
        break;
    }

    if (rule.minimumAmount && amount < Number(rule.minimumAmount)) {
      amount = Number(rule.minimumAmount);
    }
    if (rule.maximumAmount && amount > Number(rule.maximumAmount)) {
      amount = Number(rule.maximumAmount);
    }

    if (rule.roundingPolicy === 'NEAREST_INTEGER') {
      amount = Math.round(amount);
    }

    const cd = rule.chargeDefinition;
    const desc = cd ? cd.name : 'Maintenance Charge';
    const mappingKey =
      rule.accountingMappingKey || cd?.accountingMappingKey || 'MAINTENANCE_INCOME';

    return {
      chargeDefinitionId: rule.chargeDefinitionId,
      descriptionSnapshot: desc,
      quantity,
      rate,
      amount,
      discountAmount: 0,
      waiverAmount: 0,
      netAmount: amount,
      fundId: rule.fundId || null,
      costCenterId: rule.costCenterId || null,
      accountingMappingKey: mappingKey,
    };
  }
}
