import { Injectable, BadRequestException } from '@nestjs/common';
import type { BusinessCalendar, BusinessCalendarException } from '@community-os/types';

@Injectable()
export class BusinessCalendarService {
  /**
   * Calculates the exact deadline Date by adding duration in minutes.
   * If useBusinessHours is true, advances through working intervals, skipping weekends and holidays.
   * Otherwise, adds clock time directly.
   */
  calculateDueAt(
    startTime: Date,
    durationMinutes: number,
    useBusinessHours: boolean,
    calendar?: BusinessCalendar | null,
  ): Date {
    if (!useBusinessHours || !calendar) {
      // Clock time: straight addition of milliseconds
      return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    }

    return this.addBusinessMinutes(startTime, durationMinutes, calendar);
  }

  /**
   * Calculates the warning Date based on threshold percentage (e.g., 80%).
   */
  calculateWarningAt(
    startTime: Date,
    dueAt: Date,
    warningThresholdPercent: number,
    useBusinessHours: boolean,
    calendar?: BusinessCalendar | null,
  ): Date {
    if (warningThresholdPercent <= 0 || warningThresholdPercent >= 100) {
      return dueAt;
    }

    const totalElapsedMs = dueAt.getTime() - startTime.getTime();
    if (!useBusinessHours || !calendar) {
      const warningOffsetMs = (totalElapsedMs * warningThresholdPercent) / 100;
      return new Date(startTime.getTime() + warningOffsetMs);
    }

    const warningDurationMinutes = Math.floor(
      (((dueAt.getTime() - startTime.getTime()) / (60 * 1000)) * warningThresholdPercent) / 100,
    );

    return new Date(startTime.getTime() + warningDurationMinutes * 60 * 1000);
  }

  private addBusinessMinutes(
    startTime: Date,
    durationMinutes: number,
    calendar: BusinessCalendar,
  ): Date {
    let remainingMinutes = durationMinutes;
    const current = new Date(startTime);

    const workingDays = new Set(calendar.workingDays);
    const holidays = new Set(calendar.holidays);
    const exceptionsMap = new Map<string, BusinessCalendarException>();
    for (const exc of calendar.exceptions) {
      exceptionsMap.set(exc.date, exc);
    }

    const [startHour, startMin] = this.parseTime(calendar.workingHours.start);
    const [endHour, endMin] = this.parseTime(calendar.workingHours.end);
    const dailyWorkingMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);

    if (dailyWorkingMinutes <= 0) {
      throw new BadRequestException(
        'Invalid business calendar: working hours duration must be positive',
      );
    }

    // Advance loop safely with a max safety limit of 3650 days (10 years)
    let safetyCounter = 0;
    while (remainingMinutes > 0 && safetyCounter < 3650) {
      safetyCounter++;

      const dateStr = this.formatDateIso(current);
      const dayOfWeek = current.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

      const exception = exceptionsMap.get(dateStr);
      let isWorkingDay = false;
      let dayStartHour = startHour;
      let dayStartMin = startMin;
      let dayEndHour = endHour;
      let dayEndMin = endMin;

      if (exception) {
        isWorkingDay = exception.isWorkingDay;
        if (exception.workingHours) {
          [dayStartHour, dayStartMin] = this.parseTime(exception.workingHours.start);
          [dayEndHour, dayEndMin] = this.parseTime(exception.workingHours.end);
        }
      } else {
        isWorkingDay = workingDays.has(dayOfWeek) && !holidays.has(dateStr);
      }

      if (!isWorkingDay) {
        // Jump to next day at UTC 00:00
        current.setUTCDate(current.getUTCDate() + 1);
        current.setUTCHours(0, 0, 0, 0);
        continue;
      }

      // Check current time within working bounds for this day
      const currentMinuteOfDay = current.getUTCHours() * 60 + current.getUTCMinutes();
      const startMinuteOfDay = dayStartHour * 60 + dayStartMin;
      const endMinuteOfDay = dayEndHour * 60 + dayEndMin;

      if (currentMinuteOfDay < startMinuteOfDay) {
        // Before work starts today, fast forward to start of work
        current.setUTCHours(dayStartHour, dayStartMin, 0, 0);
      } else if (currentMinuteOfDay >= endMinuteOfDay) {
        // After work ends today, fast forward to tomorrow
        current.setUTCDate(current.getUTCDate() + 1);
        current.setUTCHours(0, 0, 0, 0);
        continue;
      }

      const activeMinuteOfDay = current.getUTCHours() * 60 + current.getUTCMinutes();
      const availableMinutesToday = endMinuteOfDay - activeMinuteOfDay;

      if (remainingMinutes <= availableMinutesToday) {
        current.setUTCMinutes(current.getUTCMinutes() + remainingMinutes);
        remainingMinutes = 0;
        break;
      } else {
        remainingMinutes -= availableMinutesToday;
        current.setUTCDate(current.getUTCDate() + 1);
        current.setUTCHours(0, 0, 0, 0);
      }
    }

    return current;
  }

  private parseTime(timeStr: string): [number, number] {
    const parts = timeStr.split(':').map((p) => parseInt(p, 10));
    return [parts[0] || 0, parts[1] || 0];
  }

  private formatDateIso(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
