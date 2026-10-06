import { Module } from '@nestjs/common';
import { VendorRepository } from './vendor.repository.js';
import { VendorEligibilityService } from './vendor-eligibility.service.js';
import { VendorPerformanceService } from './vendor-performance.service.js';
import { VendorService } from './vendor.service.js';
import { VendorController } from './vendor.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuditModule],
  providers: [VendorRepository, VendorEligibilityService, VendorPerformanceService, VendorService],
  controllers: [VendorController],
  exports: [VendorService, VendorEligibilityService, VendorPerformanceService],
})
export class VendorModule {}
