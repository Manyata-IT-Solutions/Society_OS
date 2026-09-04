import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FiscalCalendarRepository } from './fiscal-calendar.repository.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor } from '@community-os/types';

@Injectable()
export class FiscalCalendarService {
  constructor(
    private readonly fiscalRepo: FiscalCalendarRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createFiscalYear(
    data: {
      accountingEntityId: string;
      fiscalCalendarId?: string;
      name: string;
      startDate: string | Date;
      endDate: string | Date;
      generatePeriods?: boolean;
    },
    actor: Actor,
  ) {
    let calendarId = data.fiscalCalendarId;
    if (!calendarId) {
      const def = await this.fiscalRepo.findDefaultCalendar(data.accountingEntityId);
      if (!def)
        throw new NotFoundException('Default fiscal calendar not found for accounting entity');
      calendarId = def.id;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    const periodsData: Array<{
      periodNumber: number;
      name: string;
      startDate: Date;
      endDate: Date;
      status: 'OPEN';
    }> = [];

    if (data.generatePeriods !== false) {
      let current = new Date(start);
      let periodNum = 1;
      while (current < end && periodNum <= 12) {
        const periodStart = new Date(current);
        const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

        periodsData.push({
          periodNumber: periodNum,
          name: yearMonth,
          startDate: periodStart,
          endDate: periodEnd,
          status: 'OPEN',
        });

        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        periodNum++;
      }
    }

    const fy = await this.fiscalRepo.createFiscalYear({
      accountingEntity: { connect: { id: data.accountingEntityId } },
      fiscalCalendar: { connect: { id: calendarId } },
      name: data.name,
      startDate: start,
      endDate: end,
      status: 'OPEN',
      periods: {
        create: periodsData,
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_FISCAL_YEAR_OPENED ?? 'finance.fiscal_year.opened.v1',
        { name: fy.name, startDate: fy.startDate, endDate: fy.endDate },
        {
          organizationId: data.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return fy;
  }

  async getFiscalYears(accountingEntityId: string) {
    return this.fiscalRepo.findFiscalYears(accountingEntityId);
  }

  async closePeriod(
    periodId: string,
    mode: 'SOFT_CLOSE' | 'HARD_CLOSE',
    reason: string | undefined,
    actor: Actor,
  ) {
    const period = await this.fiscalRepo.findPeriodById(periodId);
    if (!period) throw new NotFoundException('Accounting period not found');

    const now = new Date();
    const updateData: any = {};

    if (mode === 'SOFT_CLOSE') {
      updateData.status = 'SOFT_CLOSED';
      updateData.softClosedAt = now;
      updateData.softClosedByUser = actor?.id ? { connect: { id: actor.id } } : undefined;
    } else {
      updateData.status = 'HARD_CLOSED';
      updateData.closedAt = now;
      updateData.closedByUser = actor?.id ? { connect: { id: actor.id } } : undefined;
    }

    const updated = await this.fiscalRepo.updatePeriod(periodId, updateData);

    this.eventsService.publish(
      createEvent(
        mode === 'SOFT_CLOSE'
          ? ((DOMAIN_EVENTS as any).FINANCE_PERIOD_SOFT_CLOSED ?? 'finance.period.soft_closed.v1')
          : ((DOMAIN_EVENTS as any).FINANCE_PERIOD_HARD_CLOSED ?? 'finance.period.hard_closed.v1'),
        { periodName: period.name, mode, reason },
        {
          organizationId: period.fiscalYear.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async reopenPeriod(periodId: string, reason: string, actor: Actor) {
    const period = await this.fiscalRepo.findPeriodById(periodId);
    if (!period) throw new NotFoundException('Accounting period not found');

    if (period.status === 'OPEN') {
      throw new BadRequestException('Period is already OPEN');
    }

    const updated = await this.fiscalRepo.updatePeriod(periodId, {
      status: 'OPEN',
      reopenedAt: new Date(),
      reopenedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      reopenReason: reason,
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_PERIOD_REOPENED ?? 'finance.period.reopened.v1',
        { periodName: period.name, reason },
        {
          organizationId: period.fiscalYear.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }
}
