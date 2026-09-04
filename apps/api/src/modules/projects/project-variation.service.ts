import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectSequenceService } from './project-sequence.service.js';
import { BudgetControlEngine } from '../budgeting/budget-control.engine.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectVariationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ProjectSequenceService,
    private readonly budgetControlEngine: BudgetControlEngine,
  ) {}

  async createVariation(dto: any, actorId?: string) {
    const variationNumber = await this.sequenceService.getNextVariationNumber(dto.projectId);

    return this.prisma.projectVariation.create({
      data: {
        projectId: dto.projectId,
        variationNumber,
        variationType: dto.variationType || 'SCOPE_CHANGE',
        reason: dto.reason,
        description: dto.description,
        scopeImpact: dto.scopeImpact,
        scheduleImpactDays: dto.scheduleImpactDays || 0,
        estimatedCostImpact: new Prisma.Decimal(dto.estimatedCostImpact || 0),
        status: 'SUBMITTED',
        requestedById: actorId,
      },
    });
  }

  async getVariations(projectId: string) {
    return this.prisma.projectVariation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveVariation(id: string, actorId?: string) {
    const variation = await this.prisma.projectVariation.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            boqs: {
              where: { isCurrentRevision: true },
              include: { lines: true },
            },
          },
        },
      },
    });
    if (!variation) throw new NotFoundException('Variation not found');

    const costImpact = variation.estimatedCostImpact;

    // Check budget control via Phase 16 if variation increases cost
    if (costImpact.gt(0)) {
      const entity = await this.prisma.accountingEntity.findFirst({
        where: { organizationId: variation.project.organizationId },
      });

      const _firstLine = variation.project.boqs?.[0]?.lines?.[0];
      const account = await this.prisma.ledgerAccount.findFirst({
        where: {
          accountingEntityId: entity?.id,
          accountType: 'EXPENSE',
        },
      });

      if (entity && account) {
        const budgetCheck = await this.budgetControlEngine.checkBudget({
          organizationId: variation.project.organizationId,
          accountingEntityId: entity.id,
          accountId: account.id,
          communityId: variation.project.communityId,
          capexInitiativeId: variation.project.capexInitiativeId || undefined,
          fundId: variation.project.fundId || undefined,
          costCenterId: variation.project.costCenterId || undefined,
          amount: Number(costImpact),
          sourceType: 'PURCHASE_ORDER',
        });

        if (budgetCheck.decision === 'BLOCKED') {
          throw new BadRequestException(
            `Variation approval blocked: Insufficient available budget (Shortfall: ₹${budgetCheck.shortfall}). A formal Budget Amendment is required.`,
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const approvedVar = await tx.projectVariation.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedCostImpact: costImpact,
          approvedById: actorId,
          approvedAt: new Date(),
        },
      });

      // Update financial summary
      const fin = await tx.projectFinancialSummary.findUnique({
        where: { projectId: variation.projectId },
      });
      if (fin) {
        const newApprovedVarTotal = fin.approvedVariations.add(costImpact);
        const newRevisedContract = fin.originalContract.add(newApprovedVarTotal);
        const newForecast = fin.forecastFinalCost.add(costImpact);
        const newAvail = fin.availableBudget.sub(costImpact);

        await tx.projectFinancialSummary.update({
          where: { projectId: variation.projectId },
          data: {
            approvedVariations: newApprovedVarTotal,
            revisedContract: newRevisedContract,
            forecastFinalCost: newForecast,
            availableBudget: newAvail,
          },
        });
      }

      return approvedVar;
    });
  }
}
