export type BudgetType =
  'OPERATING' | 'CAPEX' | 'REVENUE' | 'FUND' | 'PROJECT' | 'SUPPLEMENTARY' | 'OTHER';

export type BudgetScenario = 'BASE' | 'OPTIMISTIC' | 'CONSERVATIVE' | 'STRESS' | 'CUSTOM';

export type BudgetStatus =
  | 'DRAFT'
  | 'IN_PREPARATION'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'CLOSED'
  | 'CANCELLED';

export type BudgetLineType = 'OPEX' | 'CAPEX' | 'REVENUE';

export type AllocationMethod =
  'EQUAL' | 'MANUAL' | 'SEASONAL' | 'HISTORICAL_PATTERN' | 'RULE_BASED' | 'CUSTOM_TEMPLATE';

export type CapexCategory =
  'LIFT' | 'STP' | 'SOLAR' | 'CCTV' | 'ROAD' | 'PAINTING' | 'CLUBHOUSE' | 'FIRE_SYSTEM' | 'OTHER';

export type CapexPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CapexStatus =
  | 'PROPOSED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type AmendmentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export type TransferStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'POSTED';

export type CommitmentSourceType =
  | 'PURCHASE_REQUISITION'
  | 'PURCHASE_ORDER'
  | 'CONTRACT'
  | 'SUPPLIER_INVOICE'
  | 'MANUAL_RESERVATION';

export type CommitmentEntryType =
  | 'RESERVATION'
  | 'COMMITMENT'
  | 'COMMITMENT_ADJUSTMENT'
  | 'COMMITMENT_RELEASE'
  | 'COMMITMENT_CONSUMPTION'
  | 'REVERSAL';

export type CommitmentStatus = 'ACTIVE' | 'CONSUMED' | 'RELEASED' | 'REVERSED';

export type ForecastType =
  | 'LATEST_ESTIMATE'
  | 'ROLLING_FORECAST'
  | 'YEAR_END_FORECAST'
  | 'SCENARIO_FORECAST'
  | 'CASH_FORECAST';

export type ForecastMethod =
  | 'MANUAL'
  | 'BUDGET_REMAINDER'
  | 'RUN_RATE'
  | 'PRIOR_YEAR_PATTERN'
  | 'COMMITMENT_AWARE'
  | 'RULE_BASED';

export type VarianceCategory =
  | 'PRICE_INCREASE'
  | 'HIGHER_USAGE'
  | 'UNPLANNED_REPAIR'
  | 'TIMING_DIFFERENCE'
  | 'SCOPE_CHANGE'
  | 'LOWER_COLLECTION'
  | 'DELAYED_PROJECT'
  | 'SAVINGS'
  | 'OTHER';

export type BudgetControlMode = 'HARD' | 'SOFT' | 'OFF';

export type BudgetControlDecisionType =
  'ALLOWED' | 'ALLOWED_WITH_WARNING' | 'APPROVAL_REQUIRED' | 'BLOCKED' | 'NOT_APPLICABLE';

export interface BudgetControlCheckRequest {
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

export interface BudgetControlCheckResult {
  decision: BudgetControlDecisionType;
  budgetLineId?: string;
  budgetId?: string;
  budgetNumber?: string;
  controlMode: BudgetControlMode;
  currentApprovedBudget: number;
  actualYtd: number;
  commitments: number;
  reservations: number;
  availableBudget: number;
  requestedAmount: number;
  projectedAvailable: number;
  shortfall: number;
  reason?: string;
  approvalRequired: boolean;
}

export interface BudgetSummaryKpis {
  totalAnnualBudget: number;
  currentApprovedBudget: number;
  actualYtd: number;
  commitments: number;
  reservations: number;
  availableBudget: number;
  utilizationPercent: number;
  revenueBudget: number;
  revenueBilled: number;
  revenueCollected: number;
  collectionEfficiencyPercent: number;
  capexBudget: number;
  capexActual: number;
  capexCommitted: number;
  openExceptionsCount: number;
  materialVariancesCount: number;
}
