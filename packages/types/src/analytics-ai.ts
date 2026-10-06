export type MetricDomain =
  | 'FINANCE'
  | 'BILLING'
  | 'COLLECTIONS'
  | 'AP'
  | 'PROCUREMENT'
  | 'BUDGET'
  | 'PROJECTS'
  | 'HELPDESK'
  | 'FACILITY'
  | 'ASSETS'
  | 'INVENTORY'
  | 'VENDOR'
  | 'SECURITY'
  | 'PARKING'
  | 'AMENITIES'
  | 'WORKFORCE'
  | 'GOVERNANCE'
  | 'UTILITIES'
  | 'SUSTAINABILITY'
  | 'SAFETY'
  | 'COMPLIANCE'
  | 'CROSS_DOMAIN';

export type MetricValueType =
  'CURRENCY' | 'PERCENTAGE' | 'COUNT' | 'DURATION' | 'RATIO' | 'SCORE' | 'UNIT_QUANTITY';
export type AggregationType =
  | 'SUM'
  | 'AVG'
  | 'COUNT'
  | 'COUNT_DISTINCT'
  | 'MIN'
  | 'MAX'
  | 'RATIO'
  | 'PERCENTAGE'
  | 'CHANGE'
  | 'ROLLING_AVG'
  | 'CUMULATIVE';
export type MetricGrain =
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'FISCAL_PERIOD'
  | 'ANNUAL'
  | 'TRANSACTION';
export type MetricStatus = 'DRAFT' | 'UNDER_REVIEW' | 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';

export type DashboardType = 'SYSTEM' | 'ORGANIZATION' | 'COMMUNITY' | 'PERSONAL';
export type WidgetType =
  | 'KPI'
  | 'LINE_CHART'
  | 'BAR_CHART'
  | 'STACKED_BAR'
  | 'AREA_CHART'
  | 'DONUT'
  | 'TABLE'
  | 'HEATMAP'
  | 'PROGRESS'
  | 'ALERT_LIST'
  | 'TEXT_INSIGHT';

export type InsightType =
  | 'THRESHOLD'
  | 'TREND'
  | 'ANOMALY'
  | 'VARIANCE'
  | 'FORECAST'
  | 'DATA_QUALITY'
  | 'EXPIRY'
  | 'SLA_RISK'
  | 'OPERATIONAL_RISK'
  | 'OTHER';
export type InsightSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type AnomalyStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'UNDER_REVIEW'
  | 'EXPLAINED'
  | 'ACTION_REQUIRED'
  | 'CLOSED'
  | 'FALSE_POSITIVE';
export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'SNOOZED' | 'RESOLVED' | 'DISMISSED';

export type DataQualitySeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type DataQualityStatus = 'PASS' | 'WARN' | 'FAIL' | 'ERROR';

export type AIProviderName = 'ANTHROPIC' | 'OPENAI' | 'GEMINI' | 'LOCAL' | 'MOCK';
export type AIDataClassification =
  'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'HIGHLY_RESTRICTED';
export type AIFeedbackRating =
  'HELPFUL' | 'NOT_HELPFUL' | 'INCORRECT' | 'MISSING_SOURCE' | 'UNSAFE';

export interface MetricDefinitionModel {
  id: string;
  metricKey: string;
  name: string;
  description?: string;
  domain: MetricDomain;
  category?: string;
  valueType: MetricValueType;
  aggregationType: AggregationType;
  unit?: string;
  currencyBehavior?: string;
  grain: MetricGrain;
  sourceDataset: string;
  formula: string;
  dimensions: string[];
  status: MetricStatus;
  version: number;
}

export interface AnalyticsQueryRequest {
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  dateRange?: {
    from: string;
    to: string;
  };
  comparisonPeriod?: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR' | 'BUDGET' | 'TARGET';
  organizationId?: string;
  communityId?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsQueryResponse {
  data: any[];
  meta: {
    metrics: string[];
    dimensions?: string[];
    freshness: string;
    currency?: string;
    totalCount?: number;
  };
}

export interface ExecutiveCommandCenterSummary {
  communitiesCount: number;
  totalUnits: number;
  activeOccupancyPct: number;
  totalBilled: number;
  totalCollected: number;
  collectionEfficiencyPct: number;
  outstandingReceivables: number;
  apOutstanding: number;
  openCriticalTickets: number;
  ticketSlaCompliancePct: number;
  criticalAssetsDown: number;
  activeIncidents: number;
  complianceDueSoonOrOverdue: number;
  safetyReadinessScore: number;
  lastUpdated: string;
}

export interface AIQueryResult {
  answer: string;
  sources: {
    type: 'METRIC' | 'DOCUMENT' | 'RECORD' | 'REPORT';
    title: string;
    reference: string;
    version?: string | number;
    freshness?: string;
  }[];
  queryPlan?: any;
  confidence?: number;
  limitations?: string;
}
