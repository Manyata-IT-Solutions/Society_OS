import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';

// Services
import { MetricRegistryService } from './metric-registry.service.js';
import { AnalyticsQueryEngineService } from './analytics-query-engine.service.js';
import { ExecutiveCommandCenterService } from './executive-command-center.service.js';
import { PortfolioAnalyticsService } from './portfolio-analytics.service.js';
import { ReportEngineService } from './report-engine.service.js';
import { InsightAnomalyService } from './insight-anomaly.service.js';
import { ExecutiveAlertCenterService } from './executive-alert-center.service.js';
import { SearchService } from './search.service.js';
import { AIPlatformService } from './ai-platform.service.js';

// Controllers
import { MetricsController } from './metrics.controller.js';
import { AnalyticsQueryController } from './query.controller.js';
import { DashboardsController } from './dashboards.controller.js';
import { ReportsController } from './reports.controller.js';
import { PortfolioController } from './portfolio.controller.js';
import { InsightsController } from './insights.controller.js';
import { AlertsController } from './alerts.controller.js';
import { SearchController } from './search.controller.js';
import { AIController } from './ai.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    MetricsController,
    AnalyticsQueryController,
    DashboardsController,
    ReportsController,
    PortfolioController,
    InsightsController,
    AlertsController,
    SearchController,
    AIController,
  ],
  providers: [
    MetricRegistryService,
    AnalyticsQueryEngineService,
    ExecutiveCommandCenterService,
    PortfolioAnalyticsService,
    ReportEngineService,
    InsightAnomalyService,
    ExecutiveAlertCenterService,
    SearchService,
    AIPlatformService,
  ],
  exports: [
    MetricRegistryService,
    AnalyticsQueryEngineService,
    ExecutiveCommandCenterService,
    PortfolioAnalyticsService,
    ReportEngineService,
    InsightAnomalyService,
    ExecutiveAlertCenterService,
    SearchService,
    AIPlatformService,
  ],
})
export class AnalyticsModule {}
