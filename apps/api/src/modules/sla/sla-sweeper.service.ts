import { Injectable } from '@nestjs/common';
import { SlaInstanceRepository } from './sla-instance.repository.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS } from '@community-os/events';
import { createEvent } from '@community-os/events';
import { LoggerService } from '../logger/logger.service.js';

@Injectable()
export class SlaSweeperService {
  constructor(
    private readonly instanceRepo: SlaInstanceRepository,
    private readonly eventBus: EventsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Scans and processes impending SLA warnings and overdue breaches.
   * Authoritative against PostgreSQL, recovering safely from any Redis or queue outages.
   */
  async sweep(
    now: Date = new Date(),
  ): Promise<{ warningsProcessed: number; breachesProcessed: number }> {
    let warningsProcessed = 0;
    let breachesProcessed = 0;

    // 1. Process approaching warnings
    const warningCandidates = await this.instanceRepo.findApproachingWarnings(now, 100);
    for (const inst of warningCandidates) {
      try {
        await this.instanceRepo.update(inst.id, {
          warningNotified: true,
        });

        await this.eventBus.publish(
          createEvent(
            DOMAIN_EVENTS.SLA_WARNING,
            {
              slaInstanceId: inst.id,
              policyKey: inst.policyKey,
              resourceType: inst.resourceType,
              resourceId: inst.resourceId,
              dueAt: inst.dueAt.toISOString(),
            },
            {
              organizationId: inst.organizationId ?? undefined,
              communityId: inst.communityId ?? undefined,
            },
          ),
        );
        warningsProcessed++;
      } catch (err) {
        this.logger.error(`Error processing SLA warning for ${inst.id}`, (err as Error).message);
      }
    }

    // 2. Process overdue breaches
    const breachCandidates = await this.instanceRepo.findOverdueBreaches(now, 100);
    for (const inst of breachCandidates) {
      try {
        await this.instanceRepo.update(inst.id, {
          status: 'BREACHED',
          breachedAt: now,
          breachNotified: true,
        });

        await this.eventBus.publish(
          createEvent(
            DOMAIN_EVENTS.SLA_BREACHED,
            {
              slaInstanceId: inst.id,
              policyKey: inst.policyKey,
              resourceType: inst.resourceType,
              resourceId: inst.resourceId,
              breachedAt: now.toISOString(),
            },
            {
              organizationId: inst.organizationId ?? undefined,
              communityId: inst.communityId ?? undefined,
            },
          ),
        );
        breachesProcessed++;
      } catch (err) {
        this.logger.error(`Error processing SLA breach for ${inst.id}`, (err as Error).message);
      }
    }

    return { warningsProcessed, breachesProcessed };
  }
}
