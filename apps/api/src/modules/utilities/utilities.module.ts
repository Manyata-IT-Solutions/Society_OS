import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';

// Services
import { UtilitySequenceService } from './utility-sequence.service.js';
import { UtilityServiceMasterService } from './utility-service-master.service.js';
import { UtilityMeterMasterService } from './utility-meter-master.service.js';
import { MeterReadingValidationService } from './meter-reading-validation.service.js';
import { MeterReadingService } from './meter-reading.service.js';
import { UtilityConsumptionService } from './utility-consumption.service.js';
import { UtilityTariffService } from './utility-tariff.service.js';
import { UtilityChargeCalculationService } from './utility-charge-calculation.service.js';
import { UtilityBillingHandoffService } from './utility-billing-handoff.service.js';
import { CommonAreaAllocationService } from './common-area-allocation.service.js';
import { ElectricityBalanceService } from './electricity-balance.service.js';
import { WaterBalanceService } from './water-balance.service.js';
import { DGOperationsService } from './dg-operations.service.js';
import { SolarOperationsService } from './solar-operations.service.js';
import { TankerOperationsService } from './tanker-operations.service.js';
import { STPWTPOperationsService } from './stp-wtp-operations.service.js';
import { UtilityOutageService } from './utility-outage.service.js';
import { UtilityAnomalyService } from './utility-anomaly.service.js';
import { SustainabilityMetricsService } from './sustainability-metrics.service.js';
import { UtilitiesIntegrityService } from './utilities-integrity.service.js';
import { UtilitiesDashboardService } from './utilities-dashboard.service.js';

// Controllers
import { UtilityServicesController } from './services.controller.js';
import { UtilityMetersController } from './meters.controller.js';
import { UtilityReadingsController } from './readings.controller.js';
import { UtilityConsumptionController } from './consumption.controller.js';
import { UtilityTariffsController } from './tariffs.controller.js';
import { UtilityChargesController } from './charges.controller.js';
import { UtilityWaterController } from './water.controller.js';
import { UtilityEnergyController } from './energy.controller.js';
import { UtilityOutagesController } from './outages.controller.js';
import { UtilityAnomaliesController } from './anomalies.controller.js';
import { SustainabilityController } from './sustainability.controller.js';
import { UtilitiesDashboardController } from './dashboard.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    UtilityServicesController,
    UtilityMetersController,
    UtilityReadingsController,
    UtilityConsumptionController,
    UtilityTariffsController,
    UtilityChargesController,
    UtilityWaterController,
    UtilityEnergyController,
    UtilityOutagesController,
    UtilityAnomaliesController,
    SustainabilityController,
    UtilitiesDashboardController,
  ],
  providers: [
    UtilitySequenceService,
    UtilityServiceMasterService,
    UtilityMeterMasterService,
    MeterReadingValidationService,
    MeterReadingService,
    UtilityConsumptionService,
    UtilityTariffService,
    UtilityChargeCalculationService,
    UtilityBillingHandoffService,
    CommonAreaAllocationService,
    ElectricityBalanceService,
    WaterBalanceService,
    DGOperationsService,
    SolarOperationsService,
    TankerOperationsService,
    STPWTPOperationsService,
    UtilityOutageService,
    UtilityAnomalyService,
    SustainabilityMetricsService,
    UtilitiesIntegrityService,
    UtilitiesDashboardService,
  ],
  exports: [
    UtilitySequenceService,
    UtilityServiceMasterService,
    UtilityMeterMasterService,
    MeterReadingValidationService,
    MeterReadingService,
    UtilityConsumptionService,
    UtilityTariffService,
    UtilityChargeCalculationService,
    UtilityBillingHandoffService,
    CommonAreaAllocationService,
    ElectricityBalanceService,
    WaterBalanceService,
    DGOperationsService,
    SolarOperationsService,
    TankerOperationsService,
    STPWTPOperationsService,
    UtilityOutageService,
    UtilityAnomalyService,
    SustainabilityMetricsService,
    UtilitiesIntegrityService,
    UtilitiesDashboardService,
  ],
})
export class UtilitiesModule {}
