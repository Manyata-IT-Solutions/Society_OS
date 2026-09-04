function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BillingRunRepository } from './billing-run.repository.js';
import { BillingSequenceService } from './billing-sequence.service.js';
import { LiabilityResolverService } from './liability-resolver.service.js';
import { ChargeCalculatorService } from './charge-calculator.service.js';
import { InvoiceService } from './invoice.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { BillingRun } from '@prisma/client';

@Injectable()
export class BillingRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runRepo: BillingRunRepository,
    private readonly sequenceService: BillingSequenceService,
    private readonly liabilityResolver: LiabilityResolverService,
    private readonly chargeCalculator: ChargeCalculatorService,
    private readonly invoiceService: InvoiceService,
    private readonly eventsService: EventsService,
  ) {}

  async previewBillingRun(communityId: string, billingPeriodId: string, billingPlanId: string) {
    const period = await this.prisma.billingPeriod.findUnique({ where: { id: billingPeriodId } });
    const plan = await this.prisma.billingPlan.findUnique({
      where: { id: billingPlanId },
      include: { chargeRules: { where: { isActive: true }, include: { chargeDefinition: true } } },
    });

    if (!period || !plan) throw new NotFoundException('Period or Plan not found');

    const units = await this.prisma.unit.findMany({
      where: { communityId, status: { not: 'ARCHIVED' } },
      include: { building: true, floor: true },
    });

    const totalAccounts = units.length;
    let estimatedTotal = 0;
    const previewItems: any[] = [];

    for (const unit of units) {
      let unitTotal = 0;
      const calculatedLines = plan.chargeRules.map((rule) => {
        const line = this.chargeCalculator.calculateRule(rule, unit);
        unitTotal += line.amount;
        return line;
      });

      estimatedTotal += unitTotal;
      previewItems.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        area: Number((unit as any).superBuiltUpArea || (unit as any).builtUpArea || 1200),
        calculatedLines,
        totalAmount: unitTotal,
      });
    }

    return {
      communityId,
      billingPeriod: period.name,
      billingPlan: plan.name,
      totalUnits: totalAccounts,
      estimatedTotal,
      previewItems: previewItems.slice(0, 10),
    };
  }

  async executeBillingRun(
    data: {
      communityId: string;
      billingPeriodId: string;
      billingPlanId: string;
      runPurpose?: string;
      idempotencyKey: string;
      autoIssue?: boolean;
    },
    actor?: any,
  ): Promise<BillingRun> {
    const existing = await this.runRepo.findByIdempotencyKey(data.idempotencyKey);
    if (existing) {
      return existing;
    }

    const period = await this.prisma.billingPeriod.findUnique({
      where: { id: data.billingPeriodId },
    });
    const plan = await this.prisma.billingPlan.findUnique({
      where: { id: data.billingPlanId },
      include: { chargeRules: { where: { isActive: true }, include: { chargeDefinition: true } } },
    });
    const community = await this.prisma.community.findUnique({ where: { id: data.communityId } });

    if (!period || !plan || !community) throw new NotFoundException('Required entities not found');

    const runNumber = await this.sequenceService.getNextNumber(data.communityId, 'RUN');
    const userId = actor?.userId || actor?.id;

    const run = await this.runRepo.create({
      community: { connect: { id: data.communityId } },
      billingPeriod: { connect: { id: data.billingPeriodId } },
      billingPlan: { connect: { id: data.billingPlanId } },
      runNumber,
      runPurpose: data.runPurpose || 'REGULAR',
      status: 'PROCESSING',
      startedAt: new Date(),
      idempotencyKey: data.idempotencyKey,
      initiatedBy: isValidUuid(userId) ? { connect: { id: userId } } : undefined,
    });

    const units = await this.prisma.unit.findMany({
      where: { communityId: data.communityId, status: { not: 'ARCHIVED' } },
      include: { building: true },
    });

    let successCount = 0;
    let failureCount = 0;
    let totalBilled = 0;
    const exceptions: any[] = [];

    for (const unit of units) {
      try {
        const billableAccount = await this.liabilityResolver.resolveLiableAccountForUnit(
          data.communityId,
          unit.id,
        );

        const existingInv = await this.prisma.invoice.findFirst({
          where: { billingPeriodId: data.billingPeriodId, billableAccountId: billableAccount.id },
        });

        if (existingInv) {
          successCount++;
          totalBilled += Number(existingInv.grandTotal);
          continue;
        }

        const lines: any[] = [];
        let subtotal = 0;
        let lineIdx = 1;

        for (const rule of plan.chargeRules) {
          const calculated = this.chargeCalculator.calculateRule(rule, unit);
          subtotal += calculated.amount;
          lines.push({
            lineNumber: lineIdx++,
            chargeDefinition: { connect: { id: rule.chargeDefinitionId } },
            descriptionSnapshot: calculated.descriptionSnapshot,
            periodStart: period.startDate,
            periodEnd: period.endDate,
            quantity: calculated.quantity,
            rate: calculated.rate,
            amount: calculated.amount,
            discountAmount: 0,
            waiverAmount: 0,
            netAmount: calculated.amount,
            fund: rule.fundId ? { connect: { id: rule.fundId } } : undefined,
            costCenter: rule.costCenterId ? { connect: { id: rule.costCenterId } } : undefined,
            accountingMappingKey: calculated.accountingMappingKey,
          });
        }

        const invoiceNumber = await this.sequenceService.getNextNumber(data.communityId, 'INVOICE');

        const invoice = await this.prisma.invoice.create({
          data: {
            organization: { connect: { id: community.organizationId } },
            community: { connect: { id: data.communityId } },
            billableAccount: { connect: { id: billableAccount.id } },
            billingPeriod: { connect: { id: data.billingPeriodId } },
            billingRun: { connect: { id: run.id } },
            invoiceNumber,
            invoiceDate: period.invoiceDate,
            dueDate: period.dueDate,
            graceDate: period.graceDate,
            status: 'GENERATED',
            subtotal,
            grandTotal: subtotal,
            outstandingAmount: subtotal,
            lines: { create: lines },
          },
        });

        if (data.autoIssue !== false) {
          await this.invoiceService.issueInvoice(invoice.id, actor);
        }

        successCount++;
        totalBilled += subtotal;
      } catch (err: any) {
        failureCount++;
        exceptions.push({ unitNumber: unit.unitNumber, reason: err.message });
        console.error('BillingRun unit generation error for ' + unit.unitNumber + ':', err);
      }
    }

    const finalStatus =
      failureCount === 0 ? 'COMPLETED' : successCount > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED';

    const updated = await this.runRepo.update(run.id, {
      status: finalStatus,
      totalAccounts: units.length,
      successCount,
      failureCount,
      totalBilled,
      completedAt: new Date(),
      exceptionSummary: exceptions,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BILLING_RUN_COMPLETED ?? 'billing.run.completed.v1',
        { runId: run.id, totalBilled, successCount, failureCount },
        { organizationId: community.organizationId, userId },
      ),
    );

    return updated;
  }

  async getBillingRun(id: string): Promise<BillingRun> {
    const run = await this.runRepo.findById(id);
    if (!run) throw new NotFoundException('BillingRun not found');
    return run;
  }

  async listBillingRuns(params: {
    communityId: string;
    billingPeriodId?: string;
  }): Promise<BillingRun[]> {
    return this.runRepo.list(params);
  }
}
