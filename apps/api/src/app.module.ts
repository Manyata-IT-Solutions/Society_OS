import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from './modules/config/config.module.js';
import { LoggerModule } from './modules/logger/logger.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AuthorizationModule } from './modules/authorization/authorization.module.js';
import { IamModule } from './modules/iam/iam.module.js';
import { OrganizationModule } from './modules/organization/organization.module.js';
import { CommunityModule } from './modules/community/community.module.js';
import { PropertyModule } from './modules/property/property.module.js';
import { ResidentModule } from './modules/resident/resident.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { DocumentModule } from './modules/document/document.module.js';
import { ConfigurationModule } from './modules/configuration/configuration.module.js';
import { FeatureFlagModule } from './modules/feature-flag/feature-flag.module.js';
import { CustomFieldModule } from './modules/custom-field/custom-field.module.js';
import { TerminologyModule } from './modules/terminology/terminology.module.js';
import { RuleModule } from './modules/rule/rule.module.js';
import { ApprovalModule } from './modules/approval/approval.module.js';
import { SlaModule } from './modules/sla/sla.module.js';
import { WorkflowModule } from './modules/workflow/workflow.module.js';
import { HelpdeskModule } from './modules/helpdesk/helpdesk.module.js';
import { FacilityModule } from './modules/facility/facility.module.js';
import { AssetModule } from './modules/asset/asset.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { VendorModule } from './modules/vendor/vendor.module.js';
import { ProcurementModule } from './modules/procurement/procurement.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { AccountsPayableModule } from './modules/ap/ap.module.js';
import { TreasuryModule } from './modules/treasury/treasury.module.js';
import { BudgetingModule } from './modules/budgeting/budgeting.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { SecurityModule } from './modules/security/security.module.js';
import { ParkingModule } from './modules/parking/parking.module.js';
import { AmenityModule } from './modules/amenities/amenity.module.js';
import { WorkforceModule } from './modules/workforce/workforce.module.js';
import { GovernanceModule } from './modules/governance/governance.module.js';
import { UtilitiesModule } from './modules/utilities/utilities.module.js';
import { SafetyComplianceModule } from './modules/safety-compliance/safety-compliance.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware.js';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    RedisModule,
    HealthModule,
    EventsModule,
    AuthModule,
    AuthorizationModule,
    IamModule,
    OrganizationModule,
    CommunityModule,
    PropertyModule,
    ResidentModule,
    AuditModule,
    NotificationModule,
    DocumentModule,
    ConfigurationModule,
    FeatureFlagModule,
    CustomFieldModule,
    TerminologyModule,
    RuleModule,
    ApprovalModule,
    SlaModule,
    WorkflowModule,
    HelpdeskModule,
    FacilityModule,
    AssetModule,
    InventoryModule,
    VendorModule,
    ProcurementModule,
    FinanceModule,
    BillingModule,
    AccountsPayableModule,
    TreasuryModule,
    BudgetingModule,
    ProjectsModule,
    SecurityModule,
    ParkingModule,
    AmenityModule,
    WorkforceModule,
    GovernanceModule,
    UtilitiesModule,
    SafetyComplianceModule,
    AnalyticsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, TenantContextMiddleware).forRoutes('*');
  }
}
