import type {
  BudgetType,
  BudgetScenario,
  BudgetLineType,
  AllocationMethod,
  CapexCategory,
  CapexPriority,
  CommitmentSourceType,
  ForecastType,
  ForecastMethod,
  VarianceCategory,
} from '@community-os/types';

export interface CreateBudgetDto {
  organizationId: string;
  accountingEntityId: string;
  communityId?: string;
  fiscalYearId: string;
  name: string;
  description?: string;
  budgetType?: BudgetType;
  scenarioType?: BudgetScenario;
  currency?: string;
  templateId?: string;
  parentBudgetId?: string;
  lines?: CreateBudgetLineDto[];
}

export interface CreateBudgetLineDto {
  lineNumber?: number;
  accountId: string;
  fundId?: string;
  costCenterId?: string;
  communityId?: string;
  sectionId?: string;
  buildingId?: string;
  capexInitiativeId?: string;
  lineType?: BudgetLineType;
  description?: string;
  annualAmount: number;
  allocationMethod?: AllocationMethod;
  periodAllocations?: Array<{
    accountingPeriodId: string;
    amount: number;
    allocationMethod?: AllocationMethod;
  }>;
  notes?: string;
}

export interface UpdateBudgetLineDto {
  annualAmount?: number;
  description?: string;
  notes?: string;
  allocationMethod?: AllocationMethod;
  periodAllocations?: Array<{
    accountingPeriodId: string;
    amount: number;
    allocationMethod?: AllocationMethod;
  }>;
}

export interface CopyBudgetDto {
  targetFiscalYearId: string;
  name: string;
  description?: string;
  percentageUplift?: number;
  lineIds?: string[];
}

export interface CreateBudgetTemplateDto {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  budgetType?: BudgetType;
  lines: Array<{
    accountId: string;
    fundId?: string;
    costCenterId?: string;
    lineType?: BudgetLineType;
    allocationMethod?: AllocationMethod;
    weightPercent?: number;
    description?: string;
  }>;
}

export interface CreateBudgetAssumptionDto {
  organizationId: string;
  accountingEntityId: string;
  fiscalYearId?: string;
  name: string;
  value: number;
  unit: string;
  category?: string;
  description?: string;
  source?: string;
}

export interface CreateBudgetAmendmentDto {
  budgetId: string;
  reason: string;
  effectiveDate?: string | Date;
  lines: Array<{
    budgetLineId: string;
    amountChange: number;
    newAnnualAmount: number;
    reason?: string;
  }>;
}

export interface CreateBudgetTransferDto {
  sourceBudgetLineId: string;
  destinationBudgetLineId: string;
  amount: number;
  reason: string;
}

export interface CreateCapexInitiativeDto {
  organizationId: string;
  communityId: string;
  code?: string;
  name: string;
  description?: string;
  category?: CapexCategory;
  priority?: CapexPriority;
  businessJustification?: string;
  estimatedCost: number;
  approvedBudget?: number;
  plannedStart?: string | Date;
  plannedEnd?: string | Date;
  sponsor?: string;
  fundId?: string;
  costCenterId?: string;
  budgetLineId?: string;
  documentId?: string;
}

export interface CreateFundPlanDto {
  fundId: string;
  fiscalYearId: string;
  openingAvailable: number;
  plannedContribution: number;
  plannedUsage: number;
  forecastContribution?: number;
  forecastUsage?: number;
  notes?: string;
}

export interface CreateForecastDto {
  accountingEntityId: string;
  fiscalYearId: string;
  name: string;
  forecastType?: ForecastType;
  asOfDate?: string | Date;
  scenario?: BudgetScenario;
  method?: ForecastMethod;
  notes?: string;
}

export interface CreateVarianceExplanationDto {
  budgetLineId: string;
  accountingPeriodId?: string;
  varianceAmount: number;
  category: VarianceCategory;
  reason: string;
  comment: string;
  action?: string;
}

export interface BudgetControlCheckDto {
  organizationId: string;
  accountingEntityId: string;
  communityId?: string;
  sourceType: CommitmentSourceType;
  sourceId?: string;
  accountId: string;
  fundId?: string;
  costCenterId?: string;
  capexInitiativeId?: string;
  amount: number;
  date?: string | Date;
}
