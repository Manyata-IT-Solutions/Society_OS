import {
  MetricDomain,
  MetricValueType,
  AggregationType,
  MetricGrain,
  MetricStatus,
  DashboardType,
  WidgetType,
  InsightSeverity,
  AlertPriority,
  AIFeedbackRating,
} from '@community-os/types';

export interface CreateMetricDefinitionDto {
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
  status?: MetricStatus;
}

export interface CreateMetricTargetDto {
  metricKey: string;
  organizationId?: string;
  communityId?: string;
  period: string;
  targetValue: number;
  comparisonOperator: 'GTE' | 'LTE' | 'EQ';
}

export interface ExecuteAnalyticsQueryDto {
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

export interface CreateDashboardDefinitionDto {
  dashboardKey: string;
  name: string;
  description?: string;
  type?: DashboardType;
  organizationId?: string;
  communityId?: string;
  layoutPayload?: any;
  filtersPayload?: any;
}

export interface CreateDashboardWidgetDto {
  dashboardId: string;
  widgetKey: string;
  title: string;
  widgetType: WidgetType;
  metricKeys: string[];
  configPayload?: any;
  displayOrder?: number;
}

export interface CreateReportDefinitionDto {
  reportKey: string;
  name: string;
  description?: string;
  domain: MetricDomain;
  datasetKey: string;
  columnsPayload: any;
  filtersPayload?: any;
  groupingPayload?: any;
  sortingPayload?: any;
}

export interface ScheduleReportDto {
  reportId: string;
  scheduleCron: string;
  timezone?: string;
  format: 'CSV' | 'XLSX' | 'PDF' | 'JSON';
  recipients: string[];
  filtersPayload?: any;
}

export interface UnifiedSearchDto {
  query: string;
  resourceTypes?: string[];
  communityId?: string;
  limit?: number;
  offset?: number;
}

export interface AIAssistantQueryDto {
  prompt: string;
  useCaseKey?: string;
  communityId?: string;
  organizationId?: string;
  conversationId?: string;
}

export interface DocumentQAQueryDto {
  question: string;
  documentIds?: string[];
  communityId?: string;
}

export interface SubmitAIFeedbackDto {
  interactionId: string;
  rating: AIFeedbackRating;
  feedbackType?: string;
  comments?: string;
}

export interface RecordAnomalyDto {
  metricKey: string;
  organizationId?: string;
  communityId?: string;
  period: string;
  observedValue: number;
  baselineValue: number;
  deviationPct: number;
  method?: string;
  severity?: InsightSeverity;
  explanation?: string;
}

export interface CreateExecutiveAlertDto {
  organizationId?: string;
  communityId?: string;
  alertType: string;
  title: string;
  description?: string;
  priority: AlertPriority;
  sourceDomain: string;
  conditionPayload?: any;
}
