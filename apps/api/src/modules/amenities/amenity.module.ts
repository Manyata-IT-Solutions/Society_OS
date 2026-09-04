import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';

import { AmenitySequenceService } from './amenity-sequence.service.js';
import { AmenityMasterService } from './amenity-master.service.js';
import { AmenityScheduleService } from './amenity-schedule.service.js';
import { AmenityPolicyService } from './amenity-policy.service.js';
import { AmenityEligibilityService } from './amenity-eligibility.service.js';
import { AmenityAvailabilityEngine } from './amenity-availability.engine.js';
import { AmenityBookingService } from './amenity-booking.service.js';
import { AmenityWaitlistService } from './amenity-waitlist.service.js';
import { AmenityCheckInService } from './amenity-checkin.service.js';
import { AmenityMaintenanceService } from './amenity-maintenance.service.js';
import { AmenityDamageService } from './amenity-damage.service.js';
import { AmenityDashboardService } from './amenity-dashboard.service.js';

import { AmenityController } from './amenity.controller.js';
import { AmenityResourcesController } from './amenity-resources.controller.js';
import { AmenitySchedulesController } from './amenity-schedules.controller.js';
import { AmenityPoliciesController } from './amenity-policies.controller.js';
import { AmenityAvailabilityController } from './amenity-availability.controller.js';
import { AmenityBookingsController } from './amenity-bookings.controller.js';
import { AmenityWaitlistController } from './amenity-waitlist.controller.js';
import { AmenityMaintenanceController } from './amenity-maintenance.controller.js';
import { AmenityCheckInController } from './amenity-checkin.controller.js';
import { AmenityDamageController } from './amenity-damage.controller.js';
import { AmenityDashboardController } from './amenity-dashboard.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AmenityController,
    AmenityResourcesController,
    AmenitySchedulesController,
    AmenityPoliciesController,
    AmenityAvailabilityController,
    AmenityBookingsController,
    AmenityWaitlistController,
    AmenityMaintenanceController,
    AmenityCheckInController,
    AmenityDamageController,
    AmenityDashboardController,
  ],
  providers: [
    AmenitySequenceService,
    AmenityMasterService,
    AmenityScheduleService,
    AmenityPolicyService,
    AmenityEligibilityService,
    AmenityAvailabilityEngine,
    AmenityBookingService,
    AmenityWaitlistService,
    AmenityCheckInService,
    AmenityMaintenanceService,
    AmenityDamageService,
    AmenityDashboardService,
  ],
  exports: [
    AmenityMasterService,
    AmenityScheduleService,
    AmenityPolicyService,
    AmenityEligibilityService,
    AmenityAvailabilityEngine,
    AmenityBookingService,
    AmenityWaitlistService,
    AmenityCheckInService,
    AmenityMaintenanceService,
    AmenityDamageService,
    AmenityDashboardService,
  ],
})
export class AmenityModule {}
