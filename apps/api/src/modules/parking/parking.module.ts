import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ParkingSequenceService } from './parking-sequence.service.js';
import { VehicleRegistryService } from './vehicle-registry.service.js';
import { ParkingInventoryService } from './parking-inventory.service.js';
import { ParkingRightsService } from './parking-rights.service.js';
import { ParkingAllocationService } from './parking-allocation.service.js';
import { ParkingPermitService } from './parking-permit.service.js';
import { VisitorParkingService } from './visitor-parking.service.js';
import { ResidentVehicleAccessProviderService } from './resident-vehicle-access-provider.service.js';
import { ParkingOccupancyService } from './parking-occupancy.service.js';
import { EVChargingService } from './ev-charging.service.js';
import { ParkingViolationService } from './parking-violation.service.js';
import { ParkingDashboardService } from './parking-dashboard.service.js';

import { VehicleController } from './vehicle.controller.js';
import { ParkingInventoryController } from './parking-inventory.controller.js';
import { ParkingRightsController } from './parking-rights.controller.js';
import { ParkingAllocationController } from './parking-allocation.controller.js';
import { ParkingPermitController } from './parking-permit.controller.js';
import { VisitorParkingController } from './visitor-parking.controller.js';
import { ParkingOccupancyController } from './parking-occupancy.controller.js';
import { EVChargingController } from './ev-charging.controller.js';
import { ParkingViolationController } from './parking-violation.controller.js';
import { ParkingDashboardController } from './parking-dashboard.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    VehicleController,
    ParkingInventoryController,
    ParkingRightsController,
    ParkingAllocationController,
    ParkingPermitController,
    VisitorParkingController,
    ParkingOccupancyController,
    EVChargingController,
    ParkingViolationController,
    ParkingDashboardController,
  ],
  providers: [
    ParkingSequenceService,
    VehicleRegistryService,
    ParkingInventoryService,
    ParkingRightsService,
    ParkingAllocationService,
    ParkingPermitService,
    VisitorParkingService,
    ResidentVehicleAccessProviderService,
    ParkingOccupancyService,
    EVChargingService,
    ParkingViolationService,
    ParkingDashboardService,
  ],
  exports: [
    VehicleRegistryService,
    ParkingInventoryService,
    ParkingRightsService,
    ParkingAllocationService,
    ParkingPermitService,
    VisitorParkingService,
    ResidentVehicleAccessProviderService,
    ParkingOccupancyService,
    EVChargingService,
    ParkingViolationService,
    ParkingDashboardService,
  ],
})
export class ParkingModule {}
