import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MaintenancePlanRepository } from './maintenance-plan.repository.js';
import { MaintenancePlanService } from './maintenance-plan.service.js';

@Injectable()
export class FacilitySchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FacilitySchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly planRepo: MaintenancePlanRepository,
    private readonly planService: MaintenancePlanService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.processDueMaintenancePlans().catch((err) => {
        this.logger.error(`Error during maintenance plan sweeper run: ${err}`);
      });
    }, 60000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processDueMaintenancePlans(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let processedCount = 0;
    try {
      const now = new Date();
      const duePlans = await this.planRepo.findDuePlans(now, 50);

      for (const plan of duePlans) {
        if (!plan.nextRunAt) continue;
        try {
          const nextRunDate =
            plan.nextRunAt instanceof Date ? plan.nextRunAt : new Date(plan.nextRunAt);
          await this.planService.generateOccurrence(plan.id, nextRunDate, false);
          processedCount++;
        } catch (err) {
          this.logger.error(`Failed to generate occurrence for plan ${plan.code}: ${err}`);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }
}
